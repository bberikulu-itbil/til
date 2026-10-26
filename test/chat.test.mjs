// Run: node --test test/chat.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { PERSONAS, buildMessages, cleanHistory, parseHints, buildChain, callOpenRouter, isAction } from "../supabase/functions/til-chat/core.js";

const u = (content) => ({ role: "user", content }), a = (content) => ({ role: "assistant", content });

test("chat messages: persona prompt first, history cleaned, must end with the learner's turn", () => {
  const m = buildMessages({ persona: "baymax", messages: [a("Hi!"), { role: "system", content: "x" }, u("Hello"), { role: "user", content: "  " }] });
  assert.deepEqual(m.map((x) => x.role), ["system", "assistant", "user"]);
  assert.equal(m[0].content, PERSONAS.baymax.system);
  assert.equal(buildMessages({ persona: "baymax", messages: [u("Hi"), a("Hello")] }), null);
  assert.equal(buildMessages({ persona: "nobody", messages: [u("Hi")] }), null);
  assert.equal(buildMessages({ persona: "baymax", messages: "nope" }), null);
  assert.equal(cleanHistory(Array.from({ length: 30 }, (_, i) => u("m" + i))).length, 20);
  assert.equal(cleanHistory([u("x".repeat(5000))])[0].content.length, 1000);
});

test("actions need text; hint also carries the conversation; unknown actions are rejected", () => {
  assert.equal(buildMessages({ action: "translate", text: "  " }), null);
  assert.equal(buildMessages({ action: "hack", text: "hi" }), null);
  assert.ok(!isAction("toString"));
  const t = buildMessages({ action: "translate", text: "How are you?" });
  assert.deepEqual(t.map((x) => x.role), ["system", "user"]);
  assert.equal(t[1].content, "How are you?");
  const h = buildMessages({ action: "hint", text: "What do you do?", messages: [a("Hi"), u("Hello"), a("What do you do?")] });
  assert.match(h[1].content, /Learner: Hello/);
  assert.match(h[1].content, /Partner's last message:\nWhat do you do\?/);
});

test("parseHints finds a JSON array inside chatter and drops junk", () => {
  assert.deepEqual(parseHints('Sure!\n["I am a teacher.", "I work at a school in Kostanay.", "And you?"]'), ["I am a teacher.", "I work at a school in Kostanay.", "And you?"]);
  assert.deepEqual(parseHints('```json\n["a b", "c d", "e f", "g h"]\n```'), ["a b", "c d", "e f"]);
  assert.equal(parseHints('["only one"]'), null);
  assert.equal(parseHints("no list here"), null);
  assert.equal(parseHints("[not json]"), null);
  assert.equal(parseHints('[1, 2, 3]'), null);
});

test("buildChain keeps the user's models first, drops bad ids and duplicates", () => {
  assert.deepEqual(buildChain(["a/b:free", "bad id", "x/y"], ["x/y", "f1", "f2"]), ["a/b:free", "x/y", "f1", "f2"]);
  assert.deepEqual(buildChain(undefined, ["f1"]), ["f1"]);
});

test("callOpenRouter moves on to the next group of models and throws the last error", async () => {
  const calls = [];
  const fetcher = async (url, init) => {
    const body = JSON.parse(init.body); calls.push(body.models);
    return body.models[0] === "good" ? { ok: true, json: async () => ({ model: "good", choices: [{ message: { content: " Hello " } }] }) } : { ok: false, status: 429, json: async () => ({ error: { message: "rate limited" } }) };
  };
  assert.deepEqual(await callOpenRouter("k", ["m1", "m2", "m3", "good", "m5"], [u("x")], fetcher), { content: "Hello", model: "good" });
  assert.deepEqual(calls, [["m1", "m2", "m3"], ["good", "m5"]]);
  await assert.rejects(callOpenRouter("k", ["m1"], [u("x")], fetcher), /rate limited/);
  await assert.rejects(callOpenRouter("k", [], [u("x")], fetcher), /no models/);
  const empty = async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: " " } }] }) });
  await assert.rejects(callOpenRouter("k", ["m1"], [u("x")], empty), /HTTP|undefined|Error/i);
});

import { parseSlash } from "../chat.js";
test("parseSlash maps commands to actions and leaves ordinary text alone", () => {
  assert.deepEqual(parseSlash("/translate How are you?"), { action: "translate", text: "How are you?" });
  assert.deepEqual(parseSlash("  /GRAMMAR  She go to school "), { action: "rule", text: "She go to school" });
  assert.deepEqual(parseSlash("/explain"), { action: "explain", text: "" });
  assert.match(parseSlash("/foo bar").error, /\/translate, \/grammar, \/explain/);
  assert.equal(parseSlash("hello /translate"), null);
  assert.equal(parseSlash("1/2 cup"), null);
});
