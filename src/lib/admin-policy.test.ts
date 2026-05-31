import assert from "node:assert/strict";
import test from "node:test";
import { canManageCohort, isAdminRole } from "./admin-policy.ts";

test("admin roles can manage cohort requests", () => {
  assert.equal(isAdminRole("admin"), true);
  assert.equal(isAdminRole("founder"), false);
  assert.equal(isAdminRole(null), false);
});

test("cohort management requires admin role and matching cohort", () => {
  assert.equal(
    canManageCohort({ role: "admin", cohortId: "cohort-1" }, "cohort-1"),
    true,
  );
  assert.equal(
    canManageCohort({ role: "admin", cohortId: "cohort-1" }, "cohort-2"),
    false,
  );
  assert.equal(
    canManageCohort({ role: "founder", cohortId: "cohort-1" }, "cohort-1"),
    false,
  );
  assert.equal(canManageCohort(null, "cohort-1"), false);
});
