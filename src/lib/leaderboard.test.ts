import assert from "node:assert/strict";
import test from "node:test";
import { getLeaderboard } from "./leaderboard.ts";
import { getFounderPoints } from "./points.ts";
import { prisma } from "./prisma.ts";

test("leaderboard point totals match founder point calculation", async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const cohort = await prisma.cohort.create({
    data: { name: `Leaderboard Test ${suffix}`, slug: `leaderboard-test-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `leaderboard-founder-${suffix}@example.com`,
      name: "Leaderboard Founder",
      cohortId: cohort.id,
    },
  });
  const other = await prisma.user.create({
    data: {
      email: `leaderboard-other-${suffix}@example.com`,
      name: "Leaderboard Other",
      cohortId: cohort.id,
    },
  });
  const vendor = await prisma.vendor.create({
    data: { name: `Leaderboard Vendor ${suffix}`, category: "Legal", cohortId: cohort.id },
  });

  try {
    const review = await prisma.review.create({
      data: {
        vendorId: vendor.id,
        userId: founder.id,
        cohortId: cohort.id,
        rating: 5,
        comment:
          "We used Northstar Startup Counsel for Delaware incorporation in Q3 2025. They completed the SAFE docs in 5 days, which led to a successful seed close. The process was professional and responsive, though the fixed-fee package was expensive for our stage.",
        usedVendor: true,
      },
    });
    await prisma.helpfulVote.create({
      data: { reviewId: review.id, userId: other.id, value: true },
    });
    await prisma.contributionTag.create({
      data: { userId: founder.id, type: "reviewer" },
    });

    const [leaderboard, points] = await Promise.all([
      getLeaderboard(cohort.id),
      getFounderPoints(founder.id),
    ]);
    const entry = leaderboard.find((item) => item.userId === founder.id);

    assert.equal(entry?.points, points.total);
  } finally {
    await prisma.helpfulVote.deleteMany({ where: { userId: other.id } });
    await prisma.review.deleteMany({ where: { vendorId: vendor.id } });
    await prisma.contributionTag.deleteMany({ where: { userId: founder.id } });
    await prisma.vendor.deleteMany({ where: { id: vendor.id } });
    await prisma.user.deleteMany({ where: { id: { in: [founder.id, other.id] } } });
    await prisma.cohort.deleteMany({ where: { id: cohort.id } });
  }
});
