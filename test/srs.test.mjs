// Run: node --test test/srs.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { review, isDue, queue, INTERVALS } from "../srs.js";

const DAY = 864e5, now = 1_800_000_000_000;

test("review moves boxes and schedules the next date", () => {
  assert.deepEqual(review(undefined, 2, now), { box: 1, due: now + DAY, seen: 1 });
  assert.deepEqual(review({ box: 3, seen: 4 }, 2, now), { box: 4, due: now + 14 * DAY, seen: 5 });
  assert.deepEqual(review({ box: 5 }, 2, now), { box: 5, due: now + 30 * DAY, seen: 1 }); // stays in the last box
  assert.equal(review({ box: 6 }, 2, now).box, 5); // words saved when there were 6 boxes
  assert.deepEqual(review({ box: 3 }, 1, now), { box: 3, due: now + 7 * DAY, seen: 1 });
  assert.deepEqual(review(undefined, 1, now).box, 1);
  assert.deepEqual(review({ box: 5 }, 0, now), { box: 0, due: now + 600_000, seen: 1 });
  assert.equal(INTERVALS.length, 6); // box 0 + five Leitner boxes
});

test("queue puts overdue words first and caps new ones", () => {
  const w = (id, srs, created_at = "2026-10-01") => ({ id, created_at, data: { srs } });
  const items = [w("new2", undefined, "2026-10-02"), w("later", { due: now + 1 }), w("old", { due: now - 5 }), w("new1", undefined, "2026-10-01"), w("now", { due: now })];
  assert.deepEqual(queue(items, now).map((i) => i.id), ["old", "now", "new1", "new2"]);
  assert.deepEqual(queue(items, now, 1).map((i) => i.id), ["old", "now", "new1"]);
  assert.equal(isDue(undefined, now), true);
  assert.equal(isDue({ due: now + 1 }, now), false);
});
