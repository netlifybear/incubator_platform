import assert from "node:assert/strict";
import test from "node:test";
import { reviewCelebrationPoints } from "./review-action-presenter.ts";

test("review celebration points use quality-adjusted points instead of a flat 10", () => {
  assert.equal(reviewCelebrationPoints("Great service"), 0);
  assert.equal(
    reviewCelebrationPoints(
      "We used Northstar Startup Counsel for Delaware incorporation in Q3 2025. They completed the SAFE docs in 5 days, which led to a successful seed close. The process was professional and responsive, though expensive.",
    ),
    10,
  );
});
