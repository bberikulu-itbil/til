// Run: node --test test/stats.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { streaks, weekOf, addDays, dayKey } from "../stats.js";

test("streaks: current survives an unfinished today, best is the longest run", () => {
  assert.deepEqual(streaks(["2026-10-18", "2026-10-19"], "2026-10-20"), { current: 2, best: 2 });
  assert.deepEqual(streaks(["2026-10-18", "2026-10-19", "2026-10-20"], "2026-10-20"), { current: 3, best: 3 });
  assert.deepEqual(streaks(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-19"], "2026-10-20"), { current: 1, best: 4 });
  assert.deepEqual(streaks(["2026-10-17"], "2026-10-20"), { current: 0, best: 1 });
  assert.deepEqual(streaks([], "2026-10-20"), { current: 0, best: 0 });
  assert.deepEqual(streaks(["2026-02-28", "2026-03-01"], "2026-03-01"), { current: 2, best: 2 });
});

test("week starts on Monday; day keys follow the time zone", () => {
  assert.deepEqual(weekOf("2026-10-20"), ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"]);
  assert.equal(weekOf("2026-10-25")[0], "2026-10-19");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(dayKey(new Date("2026-10-19T19:30:00Z"), "Asia/Qostanay"), "2026-10-20"); // 00:30 local is the next day
});
