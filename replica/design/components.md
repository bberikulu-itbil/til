# Components: Тіл

Built once in `ui.css` (+ `swipe.js`), shown live on `design.html`. Tokens: `tokens.css`, generated from `tokens.json` / `tokens-dark.json` by `build_css.py`.

What we took from Reword and GoPrep is the **system**: roles, a list-based home, a swipe card with helpers, a goal hero, mode cards, a tinted active tab. What we did not take: their colours (Reword's periwinkle, GoPrep's coral), their display face, mascots, photos, icons and copy. Our accent is Life Hub's language blue; icons are drawn for this app; every label is written fresh in Kazakh.

Measured from the screenshots and kept as roles: light grey page + white grouped cards (both apps), large radius on cards (~20px), pill segmented controls, tinted pill for the active bottom tab (GoPrep), 4px spacing base, 12/14/16/20/28/40 type scale. Their muted grey (Reword's light labels) fails AA; ours passes.

Fonts: **Geologica** (display) + **Golos Text** (body), both open (Google Fonts) and both checked for every Kazakh letter (ә ғ қ ң ө ұ ү һ і). Several popular faces fail that check.

```
Button
  variants  primary, secondary, ghost, danger
  sizes     sm 32px, md 44px (default, touch target), lg 52px; block = full width
  states    default, hover (brightness), active, focus-visible (2px accent ring), disabled, loading (aria-busy, label kept)
  tokens    bg accent, text on-accent, radius md, 600 weight
  a11y      real <button type="button">; loading keeps the label text for screen readers
  used on   all screens

Icon button
  44px circle, surface + border, accent icon. aria-label always set (no visible text).
  used on   S05 (listen, undo), S08

Field (label + input + error)
  states    default, focus (2px accent), invalid (aria-invalid + danger border + error text linked by aria-describedby), disabled
  tokens    border-input (3:1 on bg and surface), radius md, min height 44px
  textarea  same, min 160px, for essays (S13)
  used on   S01, S08, S09, S13, S17

List row (grouped list)
  parts     icon tile (surface-2), title + small muted line, trailing badge or chevron
  states    default, hover, focus-visible; whole row is one <button>
  used on   S04 (new / review / mixed), S08 (categories), S17, S18

Badge, chip
  badge     count on accent, 22px min (S04 due count, S05 review tab)
  chip      pill on surface-2, optional skill dot (S12 skill tabs, S15)

Segmented control
  roles     tablist + tab with aria-selected, or buttons with aria-pressed
  states    selected = surface + card shadow; scrolls horizontally when it does not fit
  used on   S05 (new / review), S15 (week, month, 3 mo, all), S17 (mode, language)

Progress
  segments  one per card of today's goal (S05); bar (S06, S13 criteria); level A1–C2 with current/next (S16)
  days      7 circles: done (accent fill), today (accent ring), empty; label is the weekday initial (S04, S16)
  tiles     2-up stat tiles, number in display face, tabular figures (streaks, minutes)

Goal hero (S02)
  accent card: days to exam, change-date button, current band → target band on a track
  a11y      the track is role="img" with a sentence label ("6.0 баллдан 7.0 мақсатқа: 50 пайыз")
  empty     no exam date: the button reads "Күнді белгілеу" and the line explains why it matters

Mode card (S07)
  radiogroup of two cards: Тану (word → meaning), Еске түсіру (meaning → word)
  states    unchecked, checked (accent border + accent-soft fill), focus-visible

Swipe card (S05, S06)
  parts     eyebrow (new/review · level · category), prompt, listen button, helpers row, answer, choices
  gesture   drag right = "Білемін" (success label), drag left = "Тағы" (danger label); commits at 28% of width or a fast flick
            (swipe.js: decide()); otherwise springs back. Pointer events: mouse, touch, pen.
            touch-action: none on the card, so iPhone Safari does not scroll the page mid-drag.
  helpers   Жазу (type the word), Көрсету (reveal), Таңдау (3 options); aria-pressed once used. Using a helper is recorded in review_log.mode.
  fallback  "← Тағы көрсет" and "Білемін →" buttons under the card do the same thing, for keyboard and screen readers
  undo      icon button restores the previous card (S05 header)
  states    idle, dragging-left, dragging-right, revealed, choice right/wrong, last card → empty state
  motion    260ms fly-out; none with prefers-reduced-motion
  note      Reword drags the other way (left = memorised). We use the more common right = know.

Criteria feedback (S13, S14)
  rows      criterion name, band (tabular), bar; overall band in the header, always labelled "болжам" (estimate)
  fix       struck-through original (danger) → correction (success) + one-line reason in Kazakh
  timer     display face; warning colour under 5 min, danger when over

Empty state, skeleton, toast
  empty     title + one helpful sentence + one action (S04 all done, S08 no words, S15 no data)
  skeleton  pulsing blocks while data loads; no animation with reduced motion
  toast     role=status; success (ink) or error (danger); 2.5s; sits above the tab bar and the safe area

Tab bar
  5 items: Бүгін, Сөздер, Жаттығу, Прогресс, Профиль. Active = accent-soft pill + accent text, aria-current="page".
  Sticky bottom, padded by the safe-area insets. 48px minimum targets.
```
