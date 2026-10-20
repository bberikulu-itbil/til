# Recon map: Reword + GoPrep → Тіл

Clean-room recon from public App Store listings. Nothing here is copied from either app: no word lists, passages, audio, text, names or images. We rebuild what the apps *do*, in our own words and content.

## 1. Scope

| question | answer (proposed) |
| --- | --- |
| Apps | **Learn English with flashcards! (Reword)** by Nikita Olifer, iOS. **GoPrep (formerly IELTS.GG)** by Aleem Labs, iOS. |
| Our platform | Web (the existing Тіл app on GitHub Pages, Supabase backend, works on iPhone from the browser / Home Screen). |
| Slice | **Reword's core loop**: daily swipe flashcards with spaced repetition, categories, recall directions, stats. **GoPrep's core loop**: write or speak an IELTS-style answer → get AI band feedback, inside a daily plan built from a target band and exam date. |
| Not in slice (v1) | Full Reading/Listening mock tests (content-heavy), paywalls, guarantees. |
| For whom | Bagdaulet personally (vocabulary + IELTS prep), later his students. |

**Core loop of the merged app:** open → today's plan → review due words (swipe) → one writing or speaking task → AI feedback → new weak words go into the deck.
That last arrow is the reason to merge: GoPrep's feedback suggests vocabulary; in our app those suggestions become flashcards automatically.

## 2. Sources

| source | URL | what it gave |
| --- | --- | --- |
| Reword App Store listing (KZ) | https://apps.apple.com/kz/app/learn-english-with-flashcards/id1324697387 | features, recall modes (v4.0), undo (v4.1), stats periods, pricing, reviews asking for sorting and mini-games |
| GoPrep App Store listing (KZ) | https://apps.apple.com/kz/app/goprep-formerly-ielts-gg/id6787395636 | four skills, AI criteria, voice tutor, daily plan, vocab modes, reminders (v1.1.0), pricing |
| reword.app | https://reword.app | not read (permission request timed out) |
| Store screenshots | both listings | **not available** in the fetched page: screen list below is inferred, see confidence |
| User's own account | — | not used. Best next source: install both, walk the core flows, drop screenshots into `replica/screens/` |
| Existing code | github.com/bberikulu-itbil/til, github.com/bberikulu-itbil/TilUiren | Til v0.1 already covers SRS, custom words, audio; TilUiren has quizzes, games and word packs worth porting |

Gaps: no screenshots or walkthrough videos yet, so layouts and empty states are guesses.

## 3. Screen inventory

Confidence: **H** = stated in a listing, **M** = implied by a stated feature, **L** = guessed.

| ID | screen | how you get there | purpose | key components | states | conf |
| --- | --- | --- | --- | --- | --- | --- |
| S01 | Onboarding | first launch | target band, exam date, level, daily minutes | stepper, choice chips, date picker | first run | M (GoPrep plan inputs) |
| S02 | Today | home tab | daily plan: due cards, one task, streak, exam countdown | plan list, progress ring, streak badge | empty plan, all done, exam passed | M |
| S03 | Swipe review | Today → Review | flashcards, swipe right = know, left = don't know, undo | card stack, audio button, undo, progress | no due cards, last card, offline | H (Reword) |
| S04 | Review setup | before a session | direction (EN→KZ, KZ→EN, both, random), status filter (all/new/studied), hands-free | segmented controls, toggles | — | H (Reword 4.0 + dev reply) |
| S05 | Type-the-word review | review mode = production | show translation, type English word, check | input, diff highlight | correct, close (typo), wrong | M (GoPrep "production") |
| S06 | Categories | Words tab | built-in packs + own categories, progress per category | list with progress bars | empty custom list | H (Reword) |
| S07 | Category detail | S06 → tap | words in a category, add to learning, sort new/old | word rows, filter, sort | empty, all learned | M |
| S08 | Add word / category | + button | own word with translation, example; AI fill | form, AI button | AI failed, duplicate | H (Reword custom) |
| S09 | AI card generator | Words → Generate | cards from a topic or pasted text | prompt input, preview list, accept | generating, model error | H (GoPrep "AI-generated cards") |
| S10 | Writing task | Practice → Writing | prompt, 40-min timer, word counter, submit | editor, timer, counter | time up, under 250 words, draft saved | H |
| S11 | Writing feedback | after submit | band per criterion, overall band, corrections inline, vocab suggestions → add to deck | criteria bars, annotated text, suggestion chips | model error, very short essay | H |
| S12 | Speaking session | Practice → Speaking | Part 1 / 2 (cue card + 1 min prep + 2 min talk) / 3, push-to-talk or hands-free | mic button, cue card, prep timer, transcript | mic denied, no speech, unsupported browser | H |
| S13 | Speaking feedback | after session | fluency, pace (wpm), pauses, filler words, band estimate, transcript | metric tiles, annotated transcript | too short to score | H |
| S14 | Progress | Progress tab | words learned, reviews per day (week/month/3m/year), band trend by skill | bar chart, period switch, band line | no data yet | H (Reword periods, GoPrep stats) |
| S15 | Settings / profile | Profile | reminders time, streak warning, exam date, target band, daily new-word limit | toggles, time picker | push not allowed | H (GoPrep 1.1.0) |
| S16 | Reading test | Practice → Reading | passage + questions | split view, question types | — | M, out of v1 |
| S17 | Listening test | Practice → Listening | audio + questions | audio player | — | M, out of v1 |

## 4. User flows

```
F01 Daily vocabulary review (Reword core)
    S02 Today -> S04 setup (remembered, skipped after first time) -> S03 swipe x N -> S02 done
    happy path: 1 tap to start, 1 swipe per card
    edge: no due cards (offer new words), undo after wrong swipe, audio unavailable, session interrupted
F02 Add own word
    S08 -> type word -> AI fills translation + example -> save -> appears in S07 and in today's new cards
    happy path: 2 taps + typing (Til v0.1 already does this)
    edge: duplicate word, AI unavailable (save without translation? no: ask for one)
F03 Write an essay and get feedback (GoPrep core)
    S02 task -> S10 write with timer -> submit -> S11 feedback -> tap suggestion -> word added to deck
    happy path: 3 taps + writing
    edge: timer ends mid-sentence (auto-submit), < 250 words (warn, still score), model timeout (keep draft)
F04 Speaking practice
    S02 task -> S12 pick part -> speak -> S13 feedback -> retry
    edge: mic denied, Kazakh-accented English misrecognised, silence, iPhone Safari STT limits
F05 Set exam goal
    S01 or S15 -> target band + date -> S02 plan rebuilt
F06 Generate cards from a topic
    S09 -> "environment, band 7" -> preview 10 cards -> accept all -> S03
```

## 5. Components

| component | variants | states | screens |
| --- | --- | --- | --- |
| Flashcard | front/back, direction EN/KZ, with/without example | idle, dragging left/right, flipped, undone | S03, S05 |
| Swipe controls | buttons as fallback for swipe | disabled at end | S03 |
| Audio button | word, sentence | playing, unsupported | S03, S07, S11 |
| Segmented control | 2–4 options | selected | S04, S14 |
| Timer | countdown, prep timer | running, warning (<5 min), ended | S10, S12 |
| Mic button | push-to-talk, toggle | idle, listening, denied | S12, Hub |
| Criteria bar | per IELTS criterion | band 0–9 | S11, S13 |
| Annotated text | correction (strike + insert), suggestion | tap to explain | S11, S13 |
| Plan item | review / task / done | due, done, skipped | S02 |
| Progress bar / ring | category, day | 0–100% | S02, S06 |
| Bar chart | week / month / 3m / year | empty | S14 |
| Streak badge | — | active, at risk, broken | S02 |
| Toast | success, error | — | all |

## 6. Inferred data model

Fits the existing Supabase `items` table (one row per record, `app` + `data` jsonb), except the review log, which is append-heavy.

```
Word (items, app='lang')  word, translation, example, note, category, level, source (manual|ai|writing),
                          srs {box, due, seen}
                          evidence: Reword custom words + categories; GoPrep SRS; Til v0.1   confidence: high
Category (items, app='lang_cat')  name, kind (pack|own), level
                          evidence: Reword "create your own categories"                 confidence: high
Review (new table review_log)  word_id, grade (0|1|2), direction, mode (swipe|type|handsfree), at
                          evidence: Reword stats by week/month/3m/year need per-review rows  confidence: medium (guess about how they store it)
Goal (items, app='exam')  target_band, exam_date, current_level, daily_minutes
                          evidence: GoPrep personalized plan inputs                     confidence: high
Attempt (items, app='exam_attempt')  skill (writing|speaking), task (task1|task2|part1|part2|part3), prompt,
                          answer_text | transcript, duration_s, feedback {criteria{...}, band, corrections[], vocab[]}
                          evidence: GoPrep AI feedback criteria and band breakdown       confidence: high
Prompt bank (static file in repo)  skill, task, text, topic
                          evidence: GoPrep question types; our own content              confidence: guess on structure
Reminder settings (items, app='settings')  remind_at, streak_warning, enabled
                          evidence: GoPrep 1.1.0                                       confidence: high
```

## 7. Feature matrix

See `replica/features.csv`: 34 rows: must 11, should 10, could 9, skip 4. Already done in Til v0.1: spaced repetition, custom words, example sentences, audio.

## 8. What cannot be cloned

- **Content**: Reword's thousands of words and translations, GoPrep's passages, recorded listening audio and mock tests. We write our own packs and prompts (AI can draft them, you check them).
- **Brand**: names Reword, GoPrep, IELTS.GG, "Preppy", "Double Score Guarantee". IELTS is a trademark of its owners: say "IELTS-style", never imply official scoring.
- **Band accuracy**: AI band scores are estimates; neither app nor ours is an official examiner.
- **Business model**: paywalls and the refund guarantee are not features for a personal app.

## 9. Size

- Screens 17 (15 in v1), flows 6, entities 7.
- Hardest parts:
  1. **Speaking feedback** that is honest: pace, pauses and fillers can come from browser speech recognition; pronunciation scoring needs an audio-capable model (cost).
  2. **Writing feedback quality** in a stable format: structured JSON from the model, consistent band estimates across free models.
  3. **Own content**: word packs by level and topic, writing/speaking prompt bank.
- Also: swipe gestures that feel native on iPhone Safari; reminders (web push only works after "Add to Home Screen").
- **Size: M** (a few weeks of evenings). v1 = F01 + F02 + F03 + F05 is about one week.
