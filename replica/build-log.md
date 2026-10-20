# Build log: Тіл

| screen | date | status | missing | harder than expected |
| --- | --- | --- | --- | --- |
| shell | 2026-10-20 | done | Practice and Progress tabs are stubs (milestones 2–3) | sharing the sign-in with Life Hub needs both sites on one origin: fine on GitHub Pages |
| S04 Today | 2026-10-20 | done | goal card (S02) comes in milestone 2 | streak days must be counted in the learner's time zone, not UTC: done in SQL (til_daily) and in stats.js |
| S05 Cards | 2026-10-20 | done | typing helper, recognition/production modes (S07) | undo needs to delete a log row, so review_log got a delete policy limited to the last 10 minutes |
| S08 Words | 2026-10-20 | partial | categories, own categories, import | — |

Migration `til_profile_reviews_attempts` applied to lcmnkcpkbkrktediyvpo on 2026-10-20 (same SQL as replica/schema.sql).
Checked: node tests (srs, swipe, stats) and a full flow in headless Chromium against a stateful mock of the API: add pack → 7 new words with one "again" and one undo → 7 log rows, 1 delete, streak 2 → 3, no console errors, no horizontal scroll at 390px.
Not checked yet: the same flow against the real database with the owner account, and finger swipes on an iPhone.
