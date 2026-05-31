import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "./prisma.ts";
import {
  cleanupTestData,
  createTestCohort,
  createTestFounder,
  createTestReview,
  createTestVendor,
  testRunId,
} from "./test-db.ts";
import { getAdminTrustMetrics } from "./admin-analytics.ts";

test("admin trust metrics count only the selected cohort", async () => {
  const run = testRunId("analytics");
  const cohort = await createTestCohort(`${run}-cohort-a`);
  const otherCohort = await createTestCohort(`${run}-cohort-b`);
  const founder = await createTestFounder({
    cohortId: cohort.id,
    email: `${run}-founder@example.com`,
  });
  const otherFounder = await createTestFounder({
    cohortId: otherCohort.id,
    email: `${run}-other@example.com`,
  });
  const vendor = await createTestVendor({ cohortId: cohort.id, name: `${run} Vendor` });
  const otherVendor = await createTestVendor({
    cohortId: otherCohort.id,
    name: `${run} Other Vendor`,
  });

  try {
    await createTestReview({
      cohortId: cohort.id,
      userId: founder.id,
      vendorId: vendor.id,
    });
    await createTestReview({
      cohortId: otherCohort.id,
      userId: otherFounder.id,
      vendorId: otherVendor.id,
    });
    await prisma.vendorRequest.create({
      data: {
        category: "Legal",
        cohortId: cohort.id,
        description: "Need help with test contracts.",
        status: "open",
        userId: founder.id,
      },
    });
    await prisma.vendorRequest.create({
      data: {
        category: "Accounting",
        cohortId: cohort.id,
        description: "Need help with test accounting.",
        fulfilledAt: new Date(),
        fulfilledVendorId: vendor.id,
        status: "fulfilled",
        userId: founder.id,
      },
    });
    await prisma.invite.create({
      data: {
        cohortId: cohort.id,
        email: `${run}-invite@example.com`,
        expiresAt: new Date(Date.now() + 86_400_000),
        token: `${run}-invite-token`,
      },
    });

    const metrics = await getAdminTrustMetrics(cohort.id);

    assert.equal(metrics.openRequests, 1);
    assert.equal(metrics.fulfilledRequests, 1);
    assert.equal(metrics.totalVendors, 1);
    assert.equal(metrics.reviews.total, 1);
    assert.equal(metrics.invites.open, 1);
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug, otherCohort.slug],
      emails: [founder.email, otherFounder.email],
    });
  }
});
