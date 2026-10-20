# Architecture: Тіл (a rebuild of Reword's and GoPrep's core features)

Built from `replica/recon.md` (S01–S18, F01–F07) and `replica/features.csv`.

## Stack

Keep what already runs. The defaults (Next.js, Vercel, Stripe…) would add a build step and services this personal app does not need.

| layer | choice | why |
| --- | --- | --- |
| web | static HTML + ES modules, no build step | already live; the user edits it directly; GitHub Pages serves modules |
| styling | plain CSS with tokens shared with Life Hub | one look across the ecosystem; replica-design fills the tokens |
| mobile | the same site on iPhone, "Add to Home Screen" | no App Store, no Mac signing problems |
| database | Supabase Postgres, project `lcmnkcpkbkrktediyvpo` | already holds Hub data; one database for the whole ecosystem |
| access | row level security, owner only (`is_hub_owner()`) | the browser talks to the database directly, so rules live in Postgres |
| auth | Supabase Auth, session shared with Life Hub | same origin (`bberikulu-itbil.github.io`) = one sign-in for every app |
| AI | the existing `assistant` Edge Function → OpenRouter | key stays server-side; model fallback chain already built |
| speech | browser Web Speech API (STT + TTS) | free; server audio model only if quality is not enough (cost) |
| payments, email | none | personal app; Supabase sends auth emails |
| jobs | none in v1 | reminders need web push + a scheduler: should-have, later |
| hosting | GitHub Pages (`/til/`) | free, deploys on push |

## Schema

Tables: **3 new + 1 reused**. Access rules: **RLS**. Full SQL: `replica/schema.sql` (checked against the live database inside a rolled-back transaction).

| table | rows | why this shape |
| --- | --- | --- |
| `items` (existing, `app = 'lang'`) | one per word: `word, translation, example, note, category, level, source, srs{box,due,seen}` | the Hub assistant already writes words here; keeping them means "add X to my dictionary" keeps working |
| `til_profile` | one per user: mode, level, target/current band, exam date, format, daily minutes, daily new words (7), tutor, time zone | S01, S02, S16, S17 |
| `review_log` | one per card answer: word, grade, queue (new/review), mode, box after, time | daily goal, streaks, stats periods (S04, S15, S16); append-only, insert + select only |
| `attempts` | one per writing/speaking attempt: prompt, answer/transcript, timing, status, band, feedback jsonb | S13, S14 and later tests |

Functions:
- `til_daily(p_since date)` → per local day: reviews, new words learned, "knew" answers. Days are counted in the profile's time zone (Asia/Qostanay).
- `til_add_pack(category, words jsonb)` → bulk-adds a word pack, skipping words already in the dictionary.

Content that is not data lives as files in the repo: `packs/*.json` (word packs), `prompts/*.json` (writing and speaking prompts). All our own, AI-drafted and checked.

Decided, not defaulted:
- Deleting a word deletes its review history (`on delete cascade`). Deleting the account deletes everything.
- Review history cannot be edited from the browser (no update/delete policy), so stats cannot drift.
- Bands are `numeric(2,1)` in half steps (check constraint), like the real scale.

## API

Most reads and writes go straight to the database through supabase-js under RLS; only AI needs the server.

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| GET `rest/v1/items?app=eq.lang` | load the dictionary (≤ 2000 words) | owner | — | words | F01, F03 |
| PATCH `rest/v1/items?id=eq.…` | save a card's new `srs` | owner | data | — | F01, F02 |
| POST `rest/v1/review_log` | log one answer | owner | word_id, grade, queue, mode, box_after | — | F01, F02 |
| POST `rest/v1/rpc/til_daily` | daily stats | owner | p_since | rows per day | F01 (S04), S15, S16 |
| POST `rest/v1/rpc/til_add_pack` | add a word pack | owner | category, words | count added | F03 |
| GET/POST/PATCH `rest/v1/til_profile` | read and save goals | owner | profile fields | profile | F04 |
| POST/PATCH `rest/v1/attempts` | save a draft, submit | owner | prompt, answer, timing | attempt | F06, F07 |
| POST `functions/v1/assistant` (existing) | chat; "add word X" with AI translation | owner | messages | reply, actions | F03 |
| POST `functions/v1/assistant` `{action:"feedback", attempt_id}` (new) | scores an attempt, writes `band` + `feedback`, status `scored` or `failed` | owner | attempt id | feedback | F06, F07 |
| POST `functions/v1/assistant` `{action:"cards", topic, level, n}` (new) | drafts n cards for a topic; the user accepts them | owner | topic, level, n ≤ 20 | card list | S09 (AI generator) |

Webhooks in/out: none. Jobs: none in v1. Later: a daily reminder via web push (Supabase cron + Edge Function), only after "Add to Home Screen" on iPhone.

## The parts that bite

- **Time zones**: timestamps are UTC; days, streaks and the daily goal are counted in the profile's zone inside `til_daily`. A review at 00:30 Astana time belongs to the new day.
- **Double taps / idempotency**: disable grade buttons while a save is in flight; one swipe = one log row.
- **Two tabs**: `srs` is last-write-wins; the log keeps every answer, so stats stay right.
- **AI output**: feedback must be JSON with fixed keys. Validate it in the function, retry once with a stricter instruction, otherwise mark the attempt `failed` and keep the essay. Never lose the user's text.
- **Rate limits**: OpenRouter free tier is 50 requests/day (1000 with $10 credit). Feedback = 1 request; card generation = 1. Show a clear message when the limit is hit.
- **Band honesty**: label every band "estimate". Free models disagree; record the model in `feedback.model`.
- **Swipe on iPhone Safari**: `touch-action: none` on the card, pointer events, thresholds; buttons stay as a fallback and for accessibility.
- **Speech**: iPhone Safari recognition and a Kazakh voice may be missing; English recognition matters most here and works on both.
- **Search**: the dictionary is filtered in the browser. Shortcut until it passes a few thousand words.
- **Offline**: not in v1.
- **Deletion**: account deletion cascades through every table.

## Build order

1. **Vertical slice: daily words with a real streak** (F01)
   Screens S04 (Learn home: goal, review count, day circles, streak), S05 (swipe card with undo).
   Tables `til_profile`, `review_log`; RPC `til_daily`. Proves: swipe → log → streak on the home screen.
2. **Must-haves**
   - S07 review modes (recognition / production) and the typing helper.
   - S08 vocabulary with categories, own words, two starter packs (B1, B2 – our own), `til_add_pack`.
   - S02 goal card: target band, exam date, days left.
   - S13 writing Task 2: timer, word count, AI feedback (`action:"feedback"`), suggested words → deck.
3. **Should-haves**
   S14 speaking parts 1–3 with pace/pause/filler metrics; S11 tutor personalities; S16 level and speaking minutes; S17 mode switch Spoken/IELTS; choice helper; AI card generator; stats periods (S15); reminders.
4. **Could-haves**
   Hands-free and browse modes, list import, lesson path (S10), reading/listening tests (S12), insights.
5. **Fixes from replica-entrepreneur**: once it has run.
