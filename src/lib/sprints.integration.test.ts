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
import { autoManageSprints, getSprintDigestInfo } from "./sprints.ts";

test("autoManageSprints creates a sprint for the current month", async () => {
  const run = testRunId("sprint-auto");
  const cohort = await createTestCohort(`${run}-cohort`);

  try {
    const result = await autoManageSprints(cohort.id);
    assert.equal(result.created, true);
    assert.ok(result.name);

    const second = await autoManageSprints(cohort.id);
    assert.equal(second.created, false);
    assert.ok(second.reason?.includes("already exists"));
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug],
      emails: [],
    });
  }
});

test("getSprintDigestInfo returns active sprint progress", async () => {
  const run = testRunId("sprint-digest-active");
  const cohort = await createTestCohort(`${run}-cohort`);
  const founder = await createTestFounder({
    cohortId: cohort.id,
    email: `${run}-founder@example.com`,
  });

  try {
    const now = new Date();
    const { prisma } = await import("./prisma.ts");
    await prisma.sprint.create({
      data: {
        cohortId: cohort.id,
        name: "Test Sprint",
        description: "Test",
        goalReviewCount: 3,
        startsAt: new Date(now.getFullYear(), now.getMonth(), 1),
        endsAt: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      },
    });

    const vendor = await createTestVendor({ cohortId: cohort.id, name: `${run} Vendor` });
    await createTestReview({ cohortId: cohort.id, userId: founder.id, vendorId: vendor.id });

    const info = await getSprintDigestInfo(cohort.id, founder.id);
    assert.ok(info);
    assert.equal(info?.activeName, "Test Sprint");
    assert.equal(info?.activeMyReviews, 1);
    assert.equal(info?.activeGoal, 3);
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug],
      emails: [founder.email],
    });
  }
});

test("getSprintDigestInfo returns recent completed sprint", async () => {
  const run = testRunId("sprint-digest-past");
  const cohort = await createTestCohort(`${run}-cohort`);
  const founder = await createTestFounder({
    cohortId: cohort.id,
    email: `${run}-founder@example.com`,
  });

  try {
    const { prisma } = await import("./prisma.ts");
    await prisma.sprint.create({
      data: {
        cohortId: cohort.id,
        name: "Past Sprint",
        description: "Past",
        goalReviewCount: 3,
        startsAt: new Date("2025-01-01"),
        endsAt: new Date("2025-01-31"),
      },
    });

    const vendor = await createTestVendor({ cohortId: cohort.id, name: `${run} Vendor` });
    await createTestReview({
      cohortId: cohort.id,
      userId: founder.id,
      vendorId: vendor.id,
      comment: "Review during sprint",
    });
    await prisma.review.updateMany({
      where: { userId: founder.id },
      data: { createdAt: new Date("2025-01-15") },
    });

    const info = await getSprintDigestInfo(cohort.id, founder.id);
    assert.ok(info);
    assert.equal(info?.recentName, "Past Sprint");
    assert.equal(info?.recentTotalReviews, 1);
    assert.equal(info?.recentParticipants, 1);
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug],
      emails: [founder.email],
    });
  }
});
