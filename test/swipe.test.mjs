// Run: node --test test/swipe.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { decide } from "../swipe.js";

test("decide commits past the threshold or on a fast flick", () => {
  assert.equal(decide(120, 400), "right");
  assert.equal(decide(-113, 400), "left");
  assert.equal(decide(100, 400), null);
  assert.equal(decide(-40, 400, -0.9), "left");
  assert.equal(decide(20, 400, 2), null); // a tap is not a flick
});
