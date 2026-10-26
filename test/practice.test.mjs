// Run: node --test test/practice.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { shuffle, matchSet, quizQuestion, sentenceRound, sentenceOk, sentenceTokens, spellingOk } from "../practice.js";

const w = (word, translation, example) => ({ id: word, data: { word, translation, example } });
const words = [w("a", "1", "I like it a lot"), w("b", "2"), w("c", "3", "Go"), w("d", "4", "She reads books every day"), w("e", "5"), w("f", "5"), w("g", "7")];
let seed = 1; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

test("shuffle keeps every item and does not touch the input", () => {
  const src = [1, 2, 3, 4, 5, 6]; assert.deepEqual(shuffle(src, rng).sort(), src); assert.deepEqual(src, [1, 2, 3, 4, 5, 6]);
});

test("matchSet: n words, both sides hold the same ones, equal translations never collide", () => {
  for (let i = 0; i < 20; i++) {
    const m = matchSet(words, 5, rng);
    assert.equal(m.left.length, 5);
    assert.deepEqual(m.left.map((x) => x.id).sort(), m.right.map((x) => x.id).sort());
    assert.equal(new Set(m.left.map((x) => x.data.translation)).size, 5);
  }
  assert.equal(matchSet(words.slice(0, 2), 5, rng).left.length, 2);
  assert.equal(matchSet([w("x", "")], 5, rng).left.length, 0);
});

test("quizQuestion: 4 distinct options with the right one inside; null when too few translations", () => {
  for (let i = 0; i < 30; i++) {
    const q = quizQuestion(words, rng);
    assert.equal(new Set(q.options).size, 4);
    assert.ok(q.options.includes(q.answer));
    assert.equal(words.find((x) => x.data.word === q.word).data.translation, q.answer);
  }
  assert.equal(quizQuestion(words.slice(0, 3), rng), null);
  assert.equal(quizQuestion([w("a", "1"), w("b", "1"), w("c", "1"), w("d", "1")], rng), null);
});

test("sentenceRound uses 3-12 word examples, shuffles them, and the original order is accepted", () => {
  for (let i = 0; i < 30; i++) {
    const r = sentenceRound(words, rng);
    assert.ok(["a", "d"].includes(r.word));
    assert.deepEqual([...r.tokens].sort(), sentenceTokens(r.sentence).sort());
    assert.notEqual(r.tokens.join(" "), r.sentence);
    assert.ok(sentenceOk(sentenceTokens(r.sentence), r.sentence));
    assert.ok(!sentenceOk(r.tokens, r.sentence));
  }
  assert.equal(sentenceRound([w("c", "3", "Go"), w("b", "2")], rng), null);
});

test("spellingOk ignores case and extra spaces only", () => {
  assert.ok(spellingOk("  Look  Forward ", "look forward"));
  assert.ok(!spellingOk("lok forward", "look forward"));
  assert.ok(!spellingOk("", "a"));
});
