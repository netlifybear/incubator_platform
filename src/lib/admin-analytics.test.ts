import assert from "node:assert/strict";
import test from "node:test";
import { adminHealthMessage } from "./admin-analytics-presenter.ts";

test("admin health message prioritizes open requests", () => {
  assert.equal(
    adminHealthMessage({ openRequests: 3, firsthandReviews: 2, totalReviews: 4 }),
    "3 open requests need admin attention.",
  );
});

test("admin health message celebrates firsthand review coverage", () => {
  assert.equal(
    adminHealthMessage({ openRequests: 0, firsthandReviews: 3, totalReviews: 4 }),
    "Most reviews are firsthand founder experience.",
  );
});

test("admin health message nudges review collection when quiet", () => {
  assert.equal(
    adminHealthMessage({ openRequests: 0, firsthandReviews: 0, totalReviews: 0 }),
    "No open requests. Next, encourage founders to add firsthand reviews.",
  );
});
