// Run: node --test test/dict.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { boxOf, boxCounts, levelsOf, filterWords, toCsv, pickWord } from "../dict.js";

const w = (word, extra = {}) => ({ id: word, data: { word, translation: "аударма", ...extra } });
const words = [
  w("achieve", { level: "B1", translation: "қол жеткізу", srs: { box: 3, due: Date.UTC(2026, 9, 30) } }),
  w("tough", { level: "C1" }),
  w("obey", { level: "A2", srs: { box: 0, due: 1 } }),
  w("legacy", { srs: { box: 6, due: 1 } }),
];

test("boxOf: new words have no box, forgotten ones show in box 1, old box 6 shows as 5", () => {
  assert.deepEqual([undefined, { box: 0 }, { box: 1 }, { box: 4 }, { box: 6 }].map(boxOf), [0, 1, 1, 4, 5]);
  assert.deepEqual(boxCounts(words), [1, 1, 0, 1, 0, 1]);
});

test("levelsOf lists levels in A1..C2 order", () => {
  assert.deepEqual(levelsOf(words), ["A2", "B1", "C1"]);
  assert.deepEqual(levelsOf([w("a", { level: "X" }), w("b", { level: "B2" })]), ["B2", "X"]);
});

test("filterWords combines search, level and box", () => {
  const ids = (f) => filterWords(words, f).map((x) => x.id);
  assert.deepEqual(ids({}), ["achieve", "tough", "obey", "legacy"]);
  assert.deepEqual(ids({ q: "ҚОЛ" }), ["achieve"]);
  assert.deepEqual(ids({ q: "ou" }), ["tough"]);
  assert.deepEqual(ids({ level: "C1" }), ["tough"]);
  assert.deepEqual(ids({ box: 0 }), ["tough"]);
  assert.deepEqual(ids({ box: 1 }), ["obey"]);
  assert.deepEqual(ids({ box: 5, level: "B1" }), []);
});

test("toCsv quotes commas and quotes, neutralises formulas, keeps empty cells", () => {
  const csv = toCsv([w("a,b", { translation: 'he said "hi"', srs: { box: 2, due: Date.UTC(2026, 9, 30) } }), w("=cmd", { translation: "-1" })]);
  assert.equal(csv.split("\r\n")[0], "word,translation,example,level,category,box,next_review");
  assert.equal(csv.split("\r\n")[1], '"a,b","he said ""hi""",,,,2,2026-10-30');
  assert.equal(csv.split("\r\n")[2], "'=cmd,'-1,,,,0,");
});

test("pickWord accepts 1-4 English words and rejects the rest", () => {
  assert.equal(pickWord("  “Achieve,” "), "Achieve");
  assert.equal(pickWord("look  forward\nto"), "look forward to");
  assert.equal(pickWord("well-known"), "well-known");
  assert.equal(pickWord("don't"), "don't");
  assert.equal(pickWord("one two three four five"), null);
  assert.equal(pickWord("қол жеткізу"), null);
  assert.equal(pickWord("42"), null);
  assert.equal(pickWord(""), null);
  assert.equal(pickWord(null), null);
});
