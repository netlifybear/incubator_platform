import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanupTestData,
  createTestCohort,
  createTestFounder,
  createTestReview,
  createTestVendor,
  testRunId,
} from "./test-db.ts";
import { getPublicVendor, getVendorForCohort } from "./vendors.ts";

test("public vendor lookup excludes named founder reviews", async () => {
  const run = testRunId("public-vendor");
  const cohort = await createTestCohort(`${run}-cohort`);
  const founder = await createTestFounder({
    cohortId: cohort.id,
    email: `${run}@example.com`,
    name: "Private Reviewer",
  });
  const vendor = await createTestVendor({ cohortId: cohort.id, name: `${run} Vendor` });

  try {
    await createTestReview({
      cohortId: cohort.id,
      userId: founder.id,
      vendorId: vendor.id,
      comment: "Private cohort context should not be public.",
    });

    const publicVendor = await getPublicVendor(vendor.id);
    assert.ok(publicVendor);
    assert.equal(publicVendor.name, vendor.name);
    assert.equal("reviews" in publicVendor, false);
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug],
      emails: [founder.email],
    });
  }
});

test("cohort vendor lookup requires the matching cohort", async () => {
  const run = testRunId("vendor-cohort");
  const cohort = await createTestCohort(`${run}-cohort`);
  const otherCohort = await createTestCohort(`${run}-other-cohort`);
  const vendor = await createTestVendor({ cohortId: cohort.id, name: `${run} Vendor` });

  try {
    const sameCohort = await getVendorForCohort(vendor.id, cohort.id);
    const other = await getVendorForCohort(vendor.id, otherCohort.id);

    assert.ok(sameCohort);
    assert.equal(other, null);
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug, otherCohort.slug],
      emails: [],
    });
  }
});
