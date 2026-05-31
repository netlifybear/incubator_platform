import assert from "node:assert/strict";
import test from "node:test";
import { formatAverageRating, reviewCountLabel } from "./vendor-presenter.ts";

test("average rating formats empty and numeric ratings", () => {
  assert.equal(formatAverageRating(null), "New");
  assert.equal(formatAverageRating(4), "4.0");
  assert.equal(formatAverageRating(4.25), "4.3");
});

test("review count label pluralizes named reviews", () => {
  assert.equal(reviewCountLabel(0), "0 named reviews");
  assert.equal(reviewCountLabel(1), "1 named review");
  assert.equal(reviewCountLabel(2), "2 named reviews");
});
