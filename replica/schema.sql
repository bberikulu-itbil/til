-- Тіл: tables added next to Life Hub's `items` (project lcmnkcpkbkrktediyvpo).
-- Words stay in public.items (app = 'lang') so the Hub assistant keeps writing them; everything below is Til-only.
-- Access: row level security, owner only, and only the hub owner (public.is_hub_owner(), same rule as items).

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- One row per user: goals and preferences (S01, S02, S16, S17).
create table public.til_profile (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  mode text not null default 'ielts' check (mode in ('spoken', 'ielts')),
  level text not null default 'B1' check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  target_band numeric(2,1) check (target_band between 0 and 9 and target_band * 2 = floor(target_band * 2)),
  current_band numeric(2,1) check (current_band between 0 and 9 and current_band * 2 = floor(current_band * 2)),
  exam_date date,
  exam_format text not null default 'academic' check (exam_format in ('academic', 'general')),
  daily_minutes int not null default 30 check (daily_minutes between 5 and 240),
  daily_new_words int not null default 7 check (daily_new_words between 1 and 50),
  tutor text not null default 'balanced' check (tutor in ('kind', 'balanced', 'strict')),
  time_zone text not null default 'Asia/Qostanay', -- streak days are counted in this zone
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger til_profile_updated before update on public.til_profile for each row execute function public.set_updated_at();

-- Append-only: one row per card answer. Feeds daily goal, streaks and stats (S04, S05, S15, S16).
create table public.review_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  word_id uuid not null references public.items (id) on delete cascade, -- deleting a word deletes its history
  grade smallint not null check (grade between 0 and 2),                 -- 0 forgot, 1 hard, 2 knew
  queue text not null check (queue in ('new', 'review')),                -- was the word new when answered
  mode text not null default 'recognition' check (mode in ('recognition', 'production', 'typing', 'choice', 'handsfree')),
  box_after smallint not null check (box_after between 0 and 6),
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index review_log_user_time_idx on public.review_log (user_id, reviewed_at desc);
create index review_log_word_idx on public.review_log (word_id);

-- Writing and speaking attempts with AI feedback (S13, S14).
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  skill text not null check (skill in ('writing', 'speaking', 'reading', 'listening')),
  task text not null check (task in ('task1', 'task2', 'part1', 'part2', 'part3', 'free_talk', 'test')),
  prompt text not null,
  answer text not null default '',          -- essay text or speech transcript
  duration_s int check (duration_s >= 0),
  word_count int check (word_count >= 0),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'scored', 'failed')),
  band numeric(2,1) check (band between 0 and 9),
  feedback jsonb not null default '{}'::jsonb, -- {criteria:{name:band}, summary, corrections:[{from,to,why}], vocab:[{word,translation}], model}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index attempts_user_skill_time_idx on public.attempts (user_id, skill, created_at desc);
create trigger attempts_updated before update on public.attempts for each row execute function public.set_updated_at();

alter table public.til_profile enable row level security;
alter table public.review_log enable row level security;
alter table public.attempts enable row level security;

create policy "owner manages own profile" on public.til_profile for all to authenticated
  using ((select auth.uid()) = user_id and (select public.is_hub_owner()))
  with check ((select auth.uid()) = user_id and (select public.is_hub_owner()));
-- Review history is written once and never edited; deletes come only from the word's cascade.
create policy "owner reads own reviews" on public.review_log for select to authenticated
  using ((select auth.uid()) = user_id and (select public.is_hub_owner()));
create policy "owner logs own reviews" on public.review_log for insert to authenticated
  with check ((select auth.uid()) = user_id and (select public.is_hub_owner())
              and exists (select 1 from public.items i where i.id = word_id and i.user_id = (select auth.uid())));
create policy "owner manages own attempts" on public.attempts for all to authenticated
  using ((select auth.uid()) = user_id and (select public.is_hub_owner()))
  with check ((select auth.uid()) = user_id and (select public.is_hub_owner()));

revoke all on public.til_profile, public.review_log, public.attempts from anon;
grant select, insert, update, delete on public.til_profile, public.attempts to authenticated;
grant select, insert on public.review_log to authenticated;

-- Per-day activity in the user's own time zone: daily goal, day circles, streaks, stats periods.
-- security invoker, so the caller's row level security applies.
create function public.til_daily(p_since date)
returns table (day date, reviews int, new_words int, knew int)
language sql stable security invoker set search_path = '' as $$
  select (r.reviewed_at at time zone coalesce(p.time_zone, 'Asia/Qostanay'))::date as day,
         count(*)::int,
         count(*) filter (where r.queue = 'new' and r.grade > 0)::int,
         count(*) filter (where r.grade = 2)::int
  from public.review_log r
  left join public.til_profile p on p.user_id = r.user_id
  where r.user_id = (select auth.uid())
    and r.reviewed_at >= (p_since::timestamp at time zone coalesce(p.time_zone, 'Asia/Qostanay'))
  group by 1
  order by 1;
$$;
revoke execute on function public.til_daily(date) from public, anon;
grant execute on function public.til_daily(date) to authenticated;

-- Adds a word pack, skipping words already in the dictionary (case-insensitive). Returns how many were added.
create function public.til_add_pack(p_category text, p_words jsonb)
returns int language sql security invoker set search_path = '' as $$
  with incoming as (
    select distinct on (lower(trim(w->>'word'))) trim(w->>'word') as word, w
    from jsonb_array_elements(p_words) w
    where coalesce(trim(w->>'word'), '') <> '' and coalesce(trim(w->>'translation'), '') <> ''
  ), added as (
    insert into public.items (app, data)
    select 'lang', jsonb_strip_nulls(jsonb_build_object(
      'word', i.word, 'translation', i.w->>'translation', 'example', i.w->>'example',
      'level', i.w->>'level', 'category', p_category, 'source', 'pack'))
    from incoming i
    where not exists (
      select 1 from public.items x
      where x.user_id = (select auth.uid()) and x.app = 'lang' and lower(x.data->>'word') = lower(i.word))
    returning 1
  )
  select count(*)::int from added;
$$;
revoke execute on function public.til_add_pack(text, jsonb) from public, anon;
grant execute on function public.til_add_pack(text, jsonb) to authenticated;
