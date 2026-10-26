import { LEARNED_BOX } from "./srs.js";
import { dayKey } from "./stats.js";

// Pure helpers for the dictionary view: Leitner box of a word, filters, CSV export, picking a word out of selected text.
export const BOXES = 5;
export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

// 0 = new (not in a box yet). A word just forgotten waits 10 minutes in srs box 0, but the learner sees it in box 1.
export const boxOf = (srs) => (srs ? Math.min(Math.max(srs.box, 1), BOXES) : 0);

// Counts per box: index 0 = new words, 1..5 = Leitner boxes.
export function boxCounts(words) {
  const counts = Array(BOXES + 1).fill(0);
  for (const w of words) counts[boxOf(w.data.srs)]++;
  return counts;
}

// Levels that occur in the dictionary, in A1..C2 order; unknown labels go last.
export function levelsOf(words) {
  const seen = [...new Set(words.map((w) => w.data.level).filter(Boolean))];
  const rank = (l) => (LEVELS.includes(l) ? LEVELS.indexOf(l) : LEVELS.length);
  return seen.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

// box: null = any, 0 = new, 1..5 = that box. level: null = any.
export function filterWords(words, { q = "", level = null, box = null } = {}) {
  const needle = q.trim().toLowerCase();
  return words.filter((w) => {
    const d = w.data;
    if (level && d.level !== level) return false;
    if (box !== null && boxOf(d.srs) !== box) return false;
    return !needle || `${d.word} ${d.translation || ""}`.toLowerCase().includes(needle);
  });
}

// Cells that start with = + - @ would run as formulas in Excel, so they get a leading apostrophe.
const cell = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function toCsv(words) {
  const head = ["word", "translation", "example", "level", "category", "box", "next_review"];
  const rows = words.map((w) => {
    const d = w.data;
    return [d.word, d.translation, d.example, d.level, d.category, boxOf(d.srs), d.srs ? new Date(d.srs.due).toISOString().slice(0, 10) : ""];
  });
  return [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

// Selected text -> a dictionary entry: 1 to 4 English words, punctuation around them dropped. Anything else -> null.
const WORD = "[A-Za-z]+(?:['’-][A-Za-z]+)*";
export function pickWord(text) {
  const t = String(text ?? "").replace(/\s+/g, " ").trim().replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "");
  return t.length <= 40 && new RegExp(`^${WORD}(?: ${WORD}){0,3}$`).test(t) ? t : null;
}

// Level map: per CEFR level how many dictionary words are learned (box 4+, two weeks between reviews).
// `now` = the highest level with at least one learned word, or null. Words without a level are not counted.
export function levelMap(words) {
  const rows = LEVELS.map((level) => {
    const own = words.filter((w) => w.data.level === level);
    return { level, total: own.length, learned: own.filter((w) => (w.data.srs?.box ?? 0) >= LEARNED_BOX).length };
  });
  const now = rows.findLast((r) => r.learned > 0)?.level ?? null;
  return { rows, now };
}

// Word of the day: same word all day for everyone; picked from words added before today so adding one mid-day does not change it.
// shortcut: falls back to all words on the first day (a word added that day can change it); store the pick if that matters.
export function wordOfDay(words, today, timeZone) {
  const usable = words.filter((w) => w.data.translation).sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const older = usable.filter((w) => dayKey(new Date(w.created_at), timeZone) < today);
  const pool = older.length ? older : usable;
  if (!pool.length) return null;
  let h = 0;
  for (const c of today) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}
