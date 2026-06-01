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
import { getAdminFlywheelMetrics } from "./admin-analytics.ts";

test("flywheel metrics count profile views and public profiles", async () => {
  const run = testRunId("flywheel");
  const cohort = await createTestCohort(`${run}-cohort`);
  const founder = await createTestFounder({
    cohortId: cohort.id,
    email: `${run}-founder@example.com`,
  });
  const hiddenFounder = await createTestFounder({
    cohortId: cohort.id,
    email: `${run}-hidden@example.com`,
  });

  try {
    await prisma.user.update({
      where: { id: founder.id },
      data: { publicProfileEnabled: true, profileViewCount: 10 },
    });
    await prisma.user.update({
      where: { id: hiddenFounder.id },
      data: { publicProfileEnabled: false, profileViewCount: 5 },
    });

    const vendor = await createTestVendor({ cohortId: cohort.id, name: `${run} Vendor` });
    await createTestReview({
      cohortId: cohort.id,
      userId: founder.id,
      vendorId: vendor.id,
    });

    await prisma.backlinkLog.create({
      data: {
        referringDomain: "example.com",
        status: "verified",
        userId: founder.id,
      },
    });

    const metrics = await getAdminFlywheelMetrics(cohort.id);

    assert.equal(metrics.totalFounders, 2);
    assert.equal(metrics.totalProfileViews, 15);
    assert.equal(metrics.avgProfileViews, 8);
    assert.equal(metrics.foundersWithPublicProfile, 1);
    assert.equal(metrics.pctPublicProfile, 50);
    assert.equal(metrics.totalReviews, 1);
    assert.equal(metrics.foundersWithReviews, 1);
    assert.equal(metrics.backlinks.verified, 1);
    assert.equal(metrics.backlinks.foundersWithBacklinks, 1);
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug],
      emails: [founder.email, hiddenFounder.email],
    });
  }
});
