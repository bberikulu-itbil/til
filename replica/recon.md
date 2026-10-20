# Recon map: Reword + GoPrep → Тіл

Clean-room recon from the public App Store listings and the user's own screenshots of both apps (his own accounts, 2026-10-20). Nothing here is copied from either app: no word lists, passages, audio, photos, mascots, text or names. We rebuild what the apps *do*, in our own words and content.

## 1. Scope

| question | answer |
| --- | --- |
| Apps | **Learn English with flashcards! (Reword)** by Nikita Olifer, iOS. **GoPrep (formerly IELTS.GG)** by Aleem Labs, iOS. |
| Our platform | Web: the existing Тіл app on GitHub Pages + Supabase, used on iPhone from the browser / Home Screen. |
| Slice | **Reword's core loop**: daily goal of new words + due reviews, swipe cards, categories, streak. **GoPrep's core loop**: target band + exam date → daily plan → write or speak → AI band feedback; plus its "Spoken English" mode (lesson path, free talk, words). |
| Not in v1 | Full Reading/Listening mock tests (content-heavy), lesson path content, paywalls, guarantees, focus music. |
| For whom | Bagdaulet personally (vocabulary + IELTS prep, current level B1 → goal 7.0), later his students. |
| Terms | GoPrep is a paid subscription on his account. We only use screenshots to understand UX patterns for a personal, non-commercial app; if this ever becomes a product, re-check both apps' terms. |

**Core loop of the merged app:** open → today (streak, exam countdown, plan) → new words + due reviews (swipe) → one writing or speaking task → AI feedback → words from the feedback go into the deck.

## 2. Sources

| source | URL / file | what it gave |
| --- | --- | --- |
| Reword App Store listing (KZ) | https://apps.apple.com/kz/app/learn-english-with-flashcards/id1324697387 | features, recall modes (v4.0), undo (v4.1), stats periods, pricing, reviews |
| GoPrep App Store listing (KZ) | https://apps.apple.com/kz/app/goprep-formerly-ielts-gg/id6787395636 | four skills, AI criteria, voice tutor, daily plan, vocab modes, reminders (v1.1.0), pricing |
| User's screenshots, Reword | `replica/screens/01–05.png` (local only, not in git) | Learn home, new-word card (both swipe states), Vocabulary, Menu |
| User's screenshots, GoPrep | `replica/screens/06–16.png` (local only, not in git) | IELTS home, Tests, tutor personas, Statistics, Profile, Preferences, Spoken-English home, review setup, lesson path, Progress |
| Existing code | github.com/bberikulu-itbil/til, github.com/bberikulu-itbil/TilUiren | Til v0.1: SRS, custom words, audio; TilUiren: quizzes, games, word packs |
| reword.app | https://reword.app | not read (permission request timed out) |

## 3. Screen inventory

Source: **R** = Reword, **G** = GoPrep. Seen = in a screenshot (high confidence); listed = only in the store text (medium).

| ID | screen | from | how you get there | purpose | key components | states seen | conf |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S01 | Onboarding / goal | G | first run, Profile | target band, exam date, daily study time (30 min), format (Academic/General), mode (Spoken English / IELTS prep) | choice cards, date picker | — | seen (profile fields) |
| S02 | Today (IELTS mode) | G | Home tab | exam card: "date not set" + set date, band slider today → goal; "Your plan for today 0/5 · ~58 min" + Start | hero card, band track, plan card | no exam date | seen |
| S03 | Today (Spoken mode) | G | Home tab | greeting + streak chip; next lesson card; free-talk minutes goal (0 of 15); "Your words: 13 cards to review" | lesson card, progress bar, words card | streak 0 | seen |
| S04 | Learn home | R | Learn tab | category chosen; **Learn new words** (learned today 0 of 7); **Review words** (5 to review); **Mixed mode**; extra modes that do not affect stats: Browse, Hands-free; stats: week days, current/best streak | settings-style list, day circles, streak tiles | upsell banner | seen |
| S05 | Card: new word | R | S04 → Learn new words | tabs New / Review (+count badge), daily progress segments (= goal 7), undo; card: status "Learning", category, photo, prompt text, three helpers: type it / reveal / choose from options; swipe one way "I've memorized, review later", the other "Keep showing" | card stack, segmented tabs, helper tiles, swipe labels | mid-swipe both directions | seen |
| S06 | Card: review | R | S04 → Review words | same card, review queue | as S05 | — | listed |
| S07 | Review setup | G | Words → review | "13 cards due"; mode: Recognition (word → meaning) / Production (meaning → word, preselected); how-it-works steps | mode cards, info buttons | — | seen |
| S08 | Vocabulary | R | Vocabulary tab | search, Import, Add category, own words, big lists (expandable), topic categories with word counts, floating "+ Word" | list rows with icons and counts, FAB | own words = 1 | seen |
| S09 | Add word / category / import | R | S08 | own word, own category, import list | form | — | listed |
| S10 | Lesson path | G | Spoken mode | chapters → lessons (0 of 15), current lesson highlighted | path with nodes | not started | seen |
| S11 | Tutor (voice) | G | Tutor tab | pick a tutor personality (Classic, Kind, tougher ones…) → Start talking | carousel, sample line | — | seen |
| S12 | Tests | G | Tests tab | full exam rehearsal (~2.5 h, all four skills), skill tabs with counts, random test (unfinished first), test list with score and Retake | tabs with counters, list cards | 1 completed | seen |
| S13 | Writing task + feedback | G | Tests → Writing | prompt, timer, submit; 4 criteria + band + corrections + vocabulary | editor, timer, criteria bars | — | listed |
| S14 | Speaking task + feedback | G | Tests / Tutor | parts 1–3, fluency, pace, pauses, fillers, band | mic, transcript | — | listed |
| S15 | Statistics (IELTS) | G | Progress tab | period Week/Month/3 mo/6 mo/All, Overview/Reading/Listening, insights locked until a level check: starting band, weakest skill, typical mistakes, forecast, personal plan | period switch, locked insight rows | all locked | seen |
| S16 | Progress (Spoken) | G | Progress tab | streak week, speaking minutes (today/week/all), level A1–C2 with current → next (B1 → B2), lessons done | streak card, level bar | 0 days | seen |
| S17 | Profile & preferences | G | Profile tab | name, email, target band, daily time, format, exam date; UI language EN/RU/UZ; study reminders toggle; mode choice | form rows with edit, toggle, choice cards | reminders off | seen |
| S18 | Menu | R | Menu tab | full version, settings, other languages, backup / restore / reset progress, support | grouped list | "backup not created since July 15" | seen |

## 4. User flows

```
F01 Daily words (R core)                                  happy path: 2 taps + 1 swipe per card
    S04 -> Learn new words -> S05 swipe x 7 (daily goal) -> S04 -> Review words -> S06 swipe x N
    edge: goal reached (offer more or mixed mode), nothing due, undo a wrong swipe, swipe vs. helper (type / reveal / choose)
F02 Review with a chosen mode (G)
    S03 "Your words" -> S07 pick Recognition or Production -> cards -> done
F03 Add own word (R + our AI)
    S08 "+ Word" -> type word -> AI fills translation + example -> saved in "My words"
F04 Set the goal (G)
    S02 "Set date" or S17 -> band, date, daily minutes -> S02 shows whether the goal fits in time
F05 Today's plan (G)
    S02 Start -> plan items one by one (words, a writing or speaking task) -> 5/5
F06 Write and get feedback (G)
    S12 Writing -> S13 write with timer -> submit -> feedback -> suggested words -> deck
F07 Talk with a tutor (G)
    S11 pick personality -> speak -> review -> speaking minutes count in S16
```

## 5. Components

| component | variants | states | screens |
| --- | --- | --- | --- |
| Swipe card | new / review; prompt side = KZ or EN | idle, dragging (label + colour per side), undone | S05, S06 |
| Card helpers | type the word, reveal, choose from options | used / not used | S05 |
| Daily progress segments | one segment per card of the goal | filled | S05 |
| Day circles | Mon–Sun | studied, today, empty | S04, S16 |
| Streak tiles | current, best | 0, n | S04, S03, S16 |
| Mode card | recognition / production | selected, preselected | S07 |
| Hero goal card | exam date set / not set | band today → goal | S02 |
| Plan card | n/5 done, minutes estimate | not started, in progress, done | S02 |
| List row with icon + count | category, setting | expandable group | S08, S18 |
| Period switch | week / month / 3 mo / 6 mo / all | selected | S15 |
| Level bar | A1–C2 | current, next | S16 |
| Locked insight row | with unlock hint and minutes | locked, unlocked | S15 |
| Tab bar | 3 (R) / 5 (G) items | active | all |
| Floating add button | "+ Word" | — | S08 |

## 6. Inferred data model

Fits the existing Supabase `items` table (`app` + `data` jsonb), plus one append-only review log.

```
Word (items, app='lang')  word, translation, example, note, category, level (A1–C2), source (manual|ai|feedback),
                          srs {box, due, seen}, learned_at
                          evidence: S05 status "Learning" + category label, S08, Til v0.1     confidence: high
Category (items, app='lang_cat')  name, kind (list|topic|own), icon
                          evidence: S08 (lists, topics with counts, own words, Add category)  confidence: high
Review (table review_log)  word_id, grade, mode (new|review|recognition|production|browse), at
                          evidence: S04 learned today 0 of 7, streaks, S15/S16 periods; browse modes "do not affect stats"
                          confidence: medium (how they store it is a guess; we need it for stats)
Profile (items, app='profile')  target_band, current_band, exam_date, exam_format, daily_minutes, daily_new_words (7),
                          mode (spoken|ielts), reminders {on, at}, level (A1–C2)
                          evidence: S02, S04, S16, S17                                     confidence: high
Attempt (items, app='exam_attempt')  skill, task, prompt, answer_text|transcript, duration_s, feedback {criteria, band, corrections[], vocab[]}
                          evidence: store text on AI feedback; S12 score 0/13, Retake          confidence: high
Plan day (computed, not stored)  items[] from due cards + weakest skill + daily minutes
                          evidence: S02 "0/5 completed · ~58 min"                          confidence: medium
```

Backups (S18) disappear as a feature: our data already lives in the cloud.

## 7. Feature matrix

See `replica/features.csv`: 51 rows (must 14, should 15, could 15, skip 7). Already done in Til v0.1: spaced repetition, custom words, example sentences, audio, cloud sync.

## 8. What cannot be cloned

- **Content**: Reword's lists (its big frequency lists are third-party lists anyway: check licences before using any), topic packs and photos; GoPrep's 78+ tests, passages, recorded audio, lesson path and mascot. We write our own packs, prompts and lessons (AI drafts, you check).
- **Brand**: Reword, GoPrep, IELTS.GG, the tutor's name and face, "Double Score Guarantee". "IELTS" only descriptively ("IELTS-style"); our bands are estimates, never official.
- **Focus music**, purchases, upsells.

## 9. Size

- Screens 18 (12 in v1), flows 7, entities 6.
- Hardest parts:
  1. **Swipe cards that feel native** on iPhone Safari (drag, labels, undo, no accidental page scroll).
  2. **Honest AI feedback** for writing and speaking: structured output, stable bands across free models, pronunciation needs an audio model (cost).
  3. **Own content**: word packs by level/topic, prompt bank, later a lesson path.
- **Size: M**. v1 = F01 + F02 + F03 + F04 + F06 ≈ one week of evenings.
