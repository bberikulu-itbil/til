// Spaced repetition with Leitner boxes: a recalled word moves up a box and waits longer; a forgotten one starts over.
export const INTERVALS = [0, 1, 3, 7, 14, 30]; // days a word waits in boxes 1..5 (box 0 = just forgotten, retry in 10 minutes)
export const LEARNED_BOX = 4; // two weeks between reviews counts as learned
const DAY = 864e5;

// grade: 0 = forgot, 1 = hard, 2 = knew. Returns the new review state stored in item.data.srs.
export function review(srs, grade, now = Date.now()) {
  const box = srs?.box ?? 0;
  const seen = (srs?.seen ?? 0) + 1;
  if (grade === 0) return { box: 0, due: now + 10 * 60e3, seen };
  const next = grade === 2 ? Math.min(box + 1, INTERVALS.length - 1) : Math.max(box, 1);
  return { box: next, due: now + INTERVALS[next] * DAY, seen };
}

export const isDue = (srs, now = Date.now()) => !srs || srs.due <= now;

// Today's queue: words already in review first (most overdue first), then up to `newLimit` new words, oldest first.
export function queue(items, now = Date.now(), newLimit = 10) {
  const due = items.filter((i) => i.data.srs && i.data.srs.due <= now).sort((a, b) => a.data.srs.due - b.data.srs.due);
  const fresh = items.filter((i) => !i.data.srs).sort((a, b) => a.created_at.localeCompare(b.created_at)).slice(0, newLimit);
  return [...due, ...fresh];
}
