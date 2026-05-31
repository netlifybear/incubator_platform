import assert from "node:assert/strict";
import test from "node:test";
import { reviewContributionPoints } from "./review-quality.ts";

test("review contribution points reward specific useful detail", () => {
  assert.equal(
    reviewContributionPoints(
      "We used Northstar Startup Counsel for Delaware incorporation in Q3 2025. They completed the SAFE docs in 5 days, which led to a successful seed close. The process was professional and responsive, though the fixed-fee package was expensive for our stage.",
    ),
    10,
  );
});

test("review contribution points reduce low-effort volume incentives", () => {
  assert.equal(reviewContributionPoints("Great service"), 0);
  assert.equal(
    reviewContributionPoints("Helpful monthly close process. Best if bookkeeping basics are organized."),
    2,
  );
});

test("review contribution points penalize spammy punctuation", () => {
  assert.equal(
    reviewContributionPoints(
      "We used Northstar service for Q3 2025 filing and got docs in 5 days!!!",
    ),
    5,
  );
});
