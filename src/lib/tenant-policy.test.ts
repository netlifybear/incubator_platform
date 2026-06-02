import assert from "node:assert/strict";
import test from "node:test";
import {
  canWriteToCohort,
  canAccessCohortResource,
  getFounderDisplayName,
  hasActiveCohort,
} from "./tenant-policy.ts";

test("active cohort requires a user and cohort id", () => {
  assert.equal(hasActiveCohort(null), false);
  assert.equal(hasActiveCohort({ cohortId: null }), false);
  assert.equal(hasActiveCohort({ cohortId: "cohort-1" }), true);
});

test("cohort resource access requires matching cohort ids", () => {
  assert.equal(canAccessCohortResource({ cohortId: "cohort-1" }, "cohort-1"), true);
  assert.equal(canAccessCohortResource({ cohortId: "cohort-1" }, "cohort-2"), false);
  assert.equal(canAccessCohortResource({ cohortId: null }, "cohort-1"), false);
  assert.equal(canAccessCohortResource(null, "cohort-1"), false);
});

test("cohort writes require active founder or admin role", () => {
  assert.equal(canWriteToCohort({ cohortId: "cohort-1", role: "founder" }), true);
  assert.equal(canWriteToCohort({ cohortId: "cohort-1", role: "admin" }), true);
  assert.equal(canWriteToCohort({ cohortId: "cohort-1", role: "alumni" }), false);
  assert.equal(canWriteToCohort({ cohortId: null, role: "founder" }), false);
  assert.equal(canWriteToCohort(null), false);
});

test("founder display name falls back to email then unknown founder", () => {
  assert.equal(getFounderDisplayName({ name: "Maya Chen", email: "maya@example.com" }), "Maya Chen");
  assert.equal(getFounderDisplayName({ name: null, email: "maya@example.com" }), "maya@example.com");
  assert.equal(getFounderDisplayName({ name: null, email: null }), "Unknown founder");
});
