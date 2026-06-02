import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "./prisma.ts";
import { getCohortImpactSummary, getFounderImpactSummary } from "./impact.ts";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

test("getFounderImpactSummary returns personal contribution metrics", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `Impact Test ${suffix}`, slug: `impact-test-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `impact-founder-${suffix}@example.com`,
      name: "Impact Founder",
      cohortId: cohort.id,
      publicProfileEnabled: true,
      profileViewCount: 7,
    },
  });
  const vendor = await prisma.vendor.create({
    data: { name: `Impact Vendor ${suffix}`, category: "Legal", cohortId: cohort.id },
  });
  const review = await prisma.review.create({
    data: {
      vendorId: vendor.id,
      userId: founder.id,
      cohortId: cohort.id,
      rating: 5,
      comment: "Clear scope, fast incorporation support, and useful founder-specific guidance.",
      usedVendor: true,
    },
  });
  await prisma.helpfulVote.create({
    data: { reviewId: review.id, userId: founder.id, value: true },
  });
  await prisma.contributionTag.create({
    data: { userId: founder.id, type: "reviewer" },
  });
  await prisma.backlinkLog.create({
    data: {
      userId: founder.id,
      referringDomain: "example.com",
      targetUrl: "https://startup.example.com",
      status: "verified",
    },
  });

  const summary = await getFounderImpactSummary(founder.id);

  assert.equal(summary.reviewCount, 1);
  assert.equal(summary.helpfulVoteCount, 1);
  assert.equal(summary.contributionSignalCount, 1);
  assert.equal(summary.profileViewCount, 7);
  assert.equal(summary.verifiedBacklinkCount, 1);

  await prisma.helpfulVote.deleteMany({ where: { reviewId: review.id } });
  await prisma.contributionTag.deleteMany({ where: { userId: founder.id } });
  await prisma.backlinkLog.deleteMany({ where: { userId: founder.id } });
  await prisma.review.deleteMany({ where: { vendorId: vendor.id } });
  await prisma.vendor.deleteMany({ where: { id: vendor.id } });
  await prisma.user.deleteMany({ where: { id: founder.id } });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});

test("getCohortImpactSummary aggregates cohort activity without review text", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `Cohort Impact ${suffix}`, slug: `cohort-impact-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `cohort-impact-founder-${suffix}@example.com`,
      name: "Cohort Impact Founder",
      cohortId: cohort.id,
    },
  });
  const vendor = await prisma.vendor.create({
    data: { name: `Cohort Impact Vendor ${suffix}`, category: "Finance", cohortId: cohort.id },
  });
  const review = await prisma.review.create({
    data: {
      vendorId: vendor.id,
      userId: founder.id,
      cohortId: cohort.id,
      rating: 4,
      comment: "Reliable close process and clear migration planning for finance workflows.",
      usedVendor: true,
    },
  });

  const summary = await getCohortImpactSummary(cohort.id);

  assert.equal(summary.founderCount, 1);
  assert.equal(summary.activeContributorCount, 1);
  assert.equal(summary.reviewCount, 1);
  assert.equal("comment" in summary.topContributors[0], false);

  await prisma.review.deleteMany({ where: { id: review.id } });
  await prisma.vendor.deleteMany({ where: { id: vendor.id } });
  await prisma.user.deleteMany({ where: { id: founder.id } });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});
