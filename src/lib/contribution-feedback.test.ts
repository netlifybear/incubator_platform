import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "./prisma.ts";
import { getContributionFeedback } from "./contribution-feedback.ts";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

test("helpful votes count only votes on the founder's reviews", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `CF Cohort A ${suffix}`, slug: `cf-a-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `cf-founder-a-${suffix}@example.com`,
      name: "CF Founder A",
      cohortId: cohort.id,
    },
  });
  const other = await prisma.user.create({
    data: {
      email: `cf-other-a-${suffix}@example.com`,
      name: "CF Other A",
      cohortId: cohort.id,
    },
  });
  const vendor = await prisma.vendor.create({
    data: { name: `CF Vendor A ${suffix}`, category: "Legal", cohortId: cohort.id },
  });

  const founderReview = await prisma.review.create({
    data: {
      vendorId: vendor.id,
      userId: founder.id,
      cohortId: cohort.id,
      rating: 5,
      comment: "Great vendor.",
      usedVendor: true,
    },
  });
  const otherReview = await prisma.review.create({
    data: {
      vendorId: vendor.id,
      userId: other.id,
      cohortId: cohort.id,
      rating: 4,
      comment: "Also decent.",
      usedVendor: true,
    },
  });

  await prisma.helpfulVote.create({
    data: { reviewId: founderReview.id, userId: other.id, value: true },
  });
  await prisma.helpfulVote.create({
    data: { reviewId: otherReview.id, userId: founder.id, value: true },
  });

  const feedback = await getContributionFeedback(founder.id, cohort.id, { sinceDays: 30 });

  assert.equal(feedback.helpfulVotesReceived, 1);
  assert.equal(feedback.reviewsWritten, 1);

  await prisma.helpfulVote.deleteMany({
    where: { reviewId: { in: [founderReview.id, otherReview.id] } },
  });
  await prisma.review.deleteMany({
    where: { id: { in: [founderReview.id, otherReview.id] } },
  });
  await prisma.vendor.deleteMany({ where: { id: vendor.id } });
  await prisma.user.deleteMany({ where: { id: { in: [founder.id, other.id] } } });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});

test("targeted questions count only requests assigned to the founder", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `CF Cohort B ${suffix}`, slug: `cf-b-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `cf-founder-b-${suffix}@example.com`,
      name: "CF Founder B",
      cohortId: cohort.id,
    },
  });
  const other = await prisma.user.create({
    data: {
      email: `cf-other-b-${suffix}@example.com`,
      name: "CF Other B",
      cohortId: cohort.id,
    },
  });

  await prisma.vendorRequest.create({
    data: {
      category: "Legal",
      description: "Targeted question for founder",
      userId: other.id,
      targetUserId: founder.id,
      cohortId: cohort.id,
    },
  });
  await prisma.vendorRequest.create({
    data: {
      category: "Finance",
      description: "Not targeted at founder",
      userId: other.id,
      cohortId: cohort.id,
    },
  });

  const feedback = await getContributionFeedback(founder.id, cohort.id, { sinceDays: 30 });

  assert.equal(feedback.targetedQuestionsReceived, 1);

  await prisma.vendorRequest.deleteMany({ where: { cohortId: cohort.id } });
  await prisma.user.deleteMany({ where: { id: { in: [founder.id, other.id] } } });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});

test("other cohorts are excluded", async () => {
  const cohortA = await prisma.cohort.create({
    data: { name: `CF Cohort C ${suffix}`, slug: `cf-c-${suffix}` },
  });
  const cohortB = await prisma.cohort.create({
    data: { name: `CF Cohort D ${suffix}`, slug: `cf-d-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `cf-founder-c-${suffix}@example.com`,
      name: "CF Founder C",
      cohortId: cohortA.id,
    },
  });

  const vendor = await prisma.vendor.create({
    data: { name: `CF Vendor C ${suffix}`, category: "Legal", cohortId: cohortA.id },
  });
  const review = await prisma.review.create({
    data: {
      vendorId: vendor.id,
      userId: founder.id,
      cohortId: cohortA.id,
      rating: 5,
      comment: "Great.",
      usedVendor: true,
    },
  });

  await prisma.activityEvent.create({
    data: { type: "review_written", userId: founder.id, cohortId: cohortB.id },
  });

  const feedback = await getContributionFeedback(founder.id, cohortA.id, { sinceDays: 30 });

  assert.equal(feedback.cohortActivityCount, 0);

  await prisma.activityEvent.deleteMany({ where: { userId: founder.id } });
  await prisma.review.deleteMany({ where: { id: review.id } });
  await prisma.vendor.deleteMany({ where: { id: vendor.id } });
  await prisma.user.deleteMany({ where: { id: founder.id } });
  await prisma.cohort.deleteMany({
    where: { id: { in: [cohortA.id, cohortB.id] } },
  });
});

test("private review text is not returned in output", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `CF Cohort E ${suffix}`, slug: `cf-e-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `cf-founder-e-${suffix}@example.com`,
      name: "CF Founder E",
      cohortId: cohort.id,
    },
  });
  const vendor = await prisma.vendor.create({
    data: { name: `CF Vendor E ${suffix}`, category: "Legal", cohortId: cohort.id },
  });
  const review = await prisma.review.create({
    data: {
      vendorId: vendor.id,
      userId: founder.id,
      cohortId: cohort.id,
      rating: 5,
      comment: "This is private review text that should not leak.",
      usedVendor: true,
    },
  });

  const feedback = await getContributionFeedback(founder.id, cohort.id, { sinceDays: 30 });

  assert.equal(feedback.reviewsWritten, 1);
  assert.equal(typeof feedback.helpfulVotesReceived, "number");
  assert.equal(typeof feedback.targetedQuestionsReceived, "number");
  assert.equal(typeof feedback.cohortActivityCount, "number");
  assert.equal("comment" in (feedback as Record<string, unknown>), false);
  assert.equal("reviewText" in (feedback as Record<string, unknown>), false);

  await prisma.review.deleteMany({ where: { id: review.id } });
  await prisma.vendor.deleteMany({ where: { id: vendor.id } });
  await prisma.user.deleteMany({ where: { id: founder.id } });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});

test("suggested next action adapts to activity level", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `CF Cohort F ${suffix}`, slug: `cf-f-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `cf-founder-f-${suffix}@example.com`,
      name: "CF Founder F",
      cohortId: cohort.id,
    },
  });

  const empty = await getContributionFeedback(founder.id, cohort.id, { sinceDays: 30 });
  assert.match(empty.suggestedNextAction!, /write a vendor review/i);

  const vendor = await prisma.vendor.create({
    data: { name: `CF Vendor F ${suffix}`, category: "Legal", cohortId: cohort.id },
  });
  const review = await prisma.review.create({
    data: {
      vendorId: vendor.id,
      userId: founder.id,
      cohortId: cohort.id,
      rating: 4,
      comment: "Solid vendor.",
      usedVendor: true,
    },
  });

  const noHelp = await getContributionFeedback(founder.id, cohort.id, { sinceDays: 30 });
  assert.match(noHelp.suggestedNextAction!, /check back/i);

  await prisma.helpfulVote.create({
    data: { reviewId: review.id, userId: founder.id, value: true },
  });

  const withHelp = await getContributionFeedback(founder.id, cohort.id, { sinceDays: 30 });
  assert.match(withHelp.suggestedNextAction!, /useful/i);

  await prisma.helpfulVote.deleteMany({ where: { reviewId: review.id } });
  await prisma.review.deleteMany({ where: { id: review.id } });
  await prisma.vendor.deleteMany({ where: { id: vendor.id } });
  await prisma.user.deleteMany({ where: { id: founder.id } });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});
