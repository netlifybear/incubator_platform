import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeReviewComment,
  normalizeReviewWorkType,
  validateReviewRating,
} from "./review-validation.ts";

test("rating must be an integer from 1 to 5", () => {
  assert.doesNotThrow(() => validateReviewRating(1));
  assert.doesNotThrow(() => validateReviewRating(5));
  assert.throws(() => validateReviewRating(0), /Rating must be an integer/);
  assert.throws(() => validateReviewRating(6), /Rating must be an integer/);
  assert.throws(() => validateReviewRating(4.5), /Rating must be an integer/);
});

test("comment is trimmed and must be specific enough", () => {
  assert.equal(normalizeReviewComment("  Very useful context.  "), "Very useful context.");
  assert.throws(() => normalizeReviewComment("too short"), /at least 10 characters/);
});

test("work type is optional but trimmed when present", () => {
  assert.equal(normalizeReviewWorkType("  SAFE financing docs  "), "SAFE financing docs");
  assert.equal(normalizeReviewWorkType("  "), null);
});
