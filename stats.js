// Day keys are "YYYY-MM-DD" in the learner's time zone; streaks count days with at least one review.
export function dayKey(date, timeZone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
export function addDays(key, n) {
  const d = new Date(key + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
// current: run ending today, or ending yesterday while today is still open. best: longest run seen.
export function streaks(activeDays, today) {
  const set = new Set(activeDays);
  let current = 0;
  for (let d = set.has(today) ? today : addDays(today, -1); set.has(d); d = addDays(d, -1)) current++;
  let best = 0, run = 0, prev = null;
  for (const d of [...set].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best };
}
// Monday-first week containing `today`, as day keys.
export function weekOf(today) {
  const dow = (new Date(today + "T00:00:00Z").getUTCDay() + 6) % 7; // 0 = Monday
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - dow));
}
// XP per day row {reviews, knew, new_words}: every answer 2, a "knew" +3, a new word learned +5 (a new word known at once = 10).
export const xpOf = (row) => (row ? row.reviews * 2 + row.knew * 3 + row.new_words * 5 : 0);
