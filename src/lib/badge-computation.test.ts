import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "./prisma.ts";
import { computeAndAwardBadges } from "./badges.ts";
import { createTestCohort, createTestFounder, createTestVendor, cleanupTestData, testRunId } from "./test-db.ts";

describe("badge computation engine", () => {
  const runId = testRunId("badgecomp");
  let cohortId: string;
  let userId: string;
  let vendorId: string;

  before(async () => {
    const cohort = await createTestCohort(`badgecomp-${runId}`);
    cohortId = cohort.id;
    const user = await createTestFounder({
      cohortId,
      email: `badgecomp-${runId}@test.com`,
      name: "Badge Test",
    });
    userId = user.id;
    const vendor = await createTestVendor({ cohortId, name: `Badge Vendor ${runId}` });
    vendorId = vendor.id;
  });

  after(async () => {
    await cleanupTestData({ cohortSlugs: [`badgecomp-${runId}`], emails: [`badgecomp-${runId}@test.com`] });
  });

  it("awards reviewer and verified badges on first call", async () => {
    await prisma.review.create({
      data: {
        userId,
        cohortId,
        vendorId,
        rating: 5,
        comment: "Great service from this vendor for our startup needs in 2026.",
      },
    });

    const awarded = await computeAndAwardBadges(userId);
    assert.ok(awarded.includes("reviewer"), "should award reviewer badge");
    assert.ok(awarded.includes("verified"), "should award verified badge");
  });

  it("does not re-award existing badges (duplicate prevention)", async () => {
    const awarded = await computeAndAwardBadges(userId);
    const hasReviewer = awarded.includes("reviewer");
    const hasVerified = awarded.includes("verified");
    assert.equal(hasReviewer, false, "should not re-award reviewer");
    assert.equal(hasVerified, false, "should not re-award verified");
  });

  it("awards additional badges as criteria are met", async () => {
    for (let i = 0; i < 4; i++) {
      await prisma.review.create({
        data: {
          userId,
          cohortId,
          vendorId,
          rating: 5,
          comment: `Excellent vendor experience, helped us scale from $10k to $50k MRR in 2024, smooth process, worth every penny.`,
        },
      });
    }

    const awarded = await computeAndAwardBadges(userId);
    assert.ok(awarded.includes("top_contributor"), "should award top_contributor with 5+ reviews");
  });

  it("returns empty array when no new badges qualify", async () => {
    const awarded = await computeAndAwardBadges(userId);
    assert.equal(awarded.length, 0);
  });

  it("creates notification and activity when awarding badges", async () => {
    const newRun = testRunId("badgenotif");
    const cohort = await createTestCohort(`notif-${newRun}`);
    const user = await createTestFounder({
      cohortId: cohort.id,
      email: `notif-${newRun}@test.com`,
      name: "Notif Test",
    });

    try {
      await prisma.review.create({
        data: {
          userId: user.id,
          cohortId: cohort.id,
          vendorId,
          rating: 4,
          comment: "Decent tool for our workflow.",
        },
      });

      await computeAndAwardBadges(user.id);

      const notif = await prisma.notification.findFirst({
        where: { userId: user.id, type: "badge_earned" },
      });
      assert.ok(notif, "should create a notification for awarded badge");

      const activity = await prisma.activityEvent.findFirst({
        where: { userId: user.id, type: "badge_earned" },
      });
      assert.ok(activity, "should create an activity event for awarded badge");
    } finally {
      await cleanupTestData({ cohortSlugs: [`notif-${newRun}`], emails: [`notif-${newRun}@test.com`] });
    }
  });

  it("does not award badges for founder without cohort", async () => {
    const soloRun = testRunId("solobadge");
    const user = await createTestFounder({
      cohortId: null,
      email: `solo-${soloRun}@test.com`,
      name: "Solo Test",
    });

    try {
      await prisma.review.create({
        data: {
          userId: user.id,
          cohortId: cohortId,
          vendorId,
          rating: 4,
          comment: "Solid service provider for our needs.",
        },
      });

      const awarded = await computeAndAwardBadges(user.id);
      assert.ok(!awarded.includes("verified"), "should not award verified without cohort");
      assert.ok(awarded.includes("reviewer"), "should still award reviewer");
    } finally {
      await cleanupTestData({ emails: [`solo-${soloRun}@test.com`] });
    }
  });
});

describe("badge computation with completeness", () => {
  const runId = testRunId("bcompl");
  let cohortId: string;

  before(async () => {
    const cohort = await createTestCohort(`bcompl-${runId}`);
    cohortId = cohort.id;
  });

  after(async () => {
    await cleanupTestData({ cohortSlugs: [`bcompl-${runId}`] });
  });

  it("awards profile_complete when 4 of 5 profile fields are filled", async () => {
    const user = await createTestFounder({
      cohortId,
      email: `compl-${runId}@test.com`,
      name: "Complete User",
    });

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          bio: "Building something great.",
          startupName: "My Startup",
          startupUrl: "https://mystartup.com",
          profileSlug: `compl-${runId}`,
        },
      });

      const awarded = await computeAndAwardBadges(user.id);
      assert.ok(awarded.includes("profile_complete"), "should award profile_complete with 4 fields");
    } finally {
      await cleanupTestData({ emails: [`compl-${runId}@test.com`] });
    }
  });

  it("does not award profile_complete with fewer than 4 fields", async () => {
    const user = await createTestFounder({
      cohortId,
      email: `incompl-${runId}@test.com`,
      name: "Incomplete User",
    });

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          bio: "Building something great.",
          startupName: "My Startup",
        },
      });

      const awarded = await computeAndAwardBadges(user.id);
      assert.ok(!awarded.includes("profile_complete"), "should not award profile_complete with only 2 fields");
    } finally {
      await cleanupTestData({ emails: [`incompl-${runId}@test.com`] });
    }
  });
});
