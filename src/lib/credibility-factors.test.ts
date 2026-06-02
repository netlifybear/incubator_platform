import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "./prisma.ts";
import {
  computeCredibilityFactors,
  toPublicCredibilityFactors,
} from "./credibility-factors.ts";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function highQualityComment(): string {
  return "Excellent service! They handled our incorporation filing and saved us a lot. The process was smooth but the initial consultation felt rushed. We paid $2000 and got everything filed within 3 days.";
}

function moderateQualityComment(): string {
  return "Used ABC for tax filing. They were helpful and the price was reasonable at $1500. It worked out well.";
}

test("all factors strong", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `CF All ${suffix}`, slug: `cf-all-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `cf-all-${suffix}@example.com`,
      name: "CF All",
      cohortId: cohort.id,
      publicProfileEnabled: true,
      profileCompletePercentage: 90,
    },
  });
  const vendor = await prisma.vendor.create({
    data: { name: `CF All Vendor ${suffix}`, category: "Legal", cohortId: cohort.id },
  });

  const reviews: { id: string }[] = [];
  for (let i = 0; i < 10; i++) {
    const review = await prisma.review.create({
      data: {
        vendorId: vendor.id,
        userId: founder.id,
        cohortId: cohort.id,
        rating: 5,
        comment: highQualityComment(),
        usedVendor: true,
        createdAt: new Date(Date.now() - i * 86400000),
      },
    });
    reviews.push(review);
  }

  await prisma.helpfulVote.create({
    data: { reviewId: reviews[0].id, userId: founder.id, value: true },
  });
  for (let i = 1; i < 15; i++) {
    const other = await prisma.user.create({
      data: {
        email: `cf-all-other-${i}-${suffix}@example.com`,
        name: `Other ${i}`,
        cohortId: cohort.id,
      },
    });
    await prisma.helpfulVote.create({
      data: { reviewId: reviews[i % 10].id, userId: other.id, value: true },
    });
  }

  for (let i = 0; i < 5; i++) {
    await prisma.badge.create({ data: { userId: founder.id, type: "reviewer" } });
  }

  await prisma.backlinkLog.create({
    data: { userId: founder.id, referringDomain: "a.com", targetUrl: "https://startup.com", status: "verified" },
  });
  await prisma.backlinkLog.create({
    data: { userId: founder.id, referringDomain: "b.com", targetUrl: "https://startup.com", status: "verified" },
  });
  await prisma.backlinkLog.create({
    data: { userId: founder.id, referringDomain: "c.com", targetUrl: "https://startup.com", status: "verified" },
  });
  await prisma.backlinkLog.create({
    data: { userId: founder.id, referringDomain: "d.com", targetUrl: "https://startup.com", status: "verified" },
  });

  const result = await computeCredibilityFactors(founder.id);

  assert.equal(result.isThinFile, false);
  assert.equal(result.summary, "strong");
  for (const factor of result.factors) {
    assert.equal(factor.status, "strong", `Expected ${factor.key} to be strong`);
  }

  await prisma.backlinkLog.deleteMany({ where: { userId: founder.id } });
  await prisma.badge.deleteMany({ where: { userId: founder.id } });
  await prisma.helpfulVote.deleteMany({
    where: { reviewId: { in: reviews.map((r) => r.id) } },
  });
  await prisma.review.deleteMany({ where: { vendorId: vendor.id } });
  await prisma.vendor.deleteMany({ where: { id: vendor.id } });
  const allOthers = await prisma.user.findMany({
    where: { email: { contains: `cf-all-other-` } },
    select: { id: true },
  });
  await prisma.user.deleteMany({ where: { id: { in: [...allOthers.map((u) => u.id), founder.id] } } });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});

test("thin file", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `CF Thin ${suffix}`, slug: `cf-thin-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `cf-thin-${suffix}@example.com`,
      name: "CF Thin",
      cohortId: cohort.id,
      profileCompletePercentage: 30,
    },
  });

  const result = await computeCredibilityFactors(founder.id);

  assert.equal(result.isThinFile, true);
  assert.equal(result.summary, "needs activity");
  for (const factor of result.factors) {
    assert.equal(factor.status, "needs activity");
  }

  await prisma.user.deleteMany({ where: { id: founder.id } });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});

test("high badges no reviews", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `CF Badges ${suffix}`, slug: `cf-badges-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `cf-badges-${suffix}@example.com`,
      name: "CF Badges",
      cohortId: cohort.id,
      profileCompletePercentage: 50,
    },
  });

  for (let i = 0; i < 5; i++) {
    await prisma.badge.create({ data: { userId: founder.id, type: "reviewer" } });
  }

  const result = await computeCredibilityFactors(founder.id);

  assert.equal(result.isThinFile, true);
  assert.equal(result.summary, "needs activity");
  const cs = result.factors.find((f) => f.key === "contributionSignals");
  assert.equal(cs?.status, "strong");

  await prisma.badge.deleteMany({ where: { userId: founder.id } });
  await prisma.user.deleteMany({ where: { id: founder.id } });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});

test("mixed factors developing summary", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `CF Mixed ${suffix}`, slug: `cf-mixed-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `cf-mixed-${suffix}@example.com`,
      name: "CF Mixed",
      cohortId: cohort.id,
      profileCompletePercentage: 70,
    },
  });
  const vendor = await prisma.vendor.create({
    data: { name: `CF Mixed Vendor ${suffix}`, category: "Finance", cohortId: cohort.id },
  });

  for (let i = 0; i < 3; i++) {
    await prisma.review.create({
      data: {
        vendorId: vendor.id,
        userId: founder.id,
        cohortId: cohort.id,
        rating: 4,
        comment: moderateQualityComment(),
        usedVendor: true,
        createdAt: new Date(Date.now() - (i + 1) * 86400000),
      },
    });
  }

  const allHelpful = await prisma.review.findMany({ where: { userId: founder.id }, select: { id: true } });
  for (let i = 0; i < 2; i++) {
    const other = await prisma.user.create({
      data: { email: `cf-mixed-other-${i}-${suffix}@example.com`, name: `O${i}`, cohortId: cohort.id },
    });
    await prisma.helpfulVote.create({
      data: { reviewId: allHelpful[i % allHelpful.length].id, userId: other.id, value: true },
    });
  }

  await prisma.badge.create({ data: { userId: founder.id, type: "reviewer" } });

  await prisma.backlinkLog.create({
    data: { userId: founder.id, referringDomain: "x.com", targetUrl: "https://startup.com", status: "verified" },
  });
  await prisma.backlinkLog.create({
    data: { userId: founder.id, referringDomain: "y.com", targetUrl: "https://startup.com", status: "verified" },
  });

  const result = await computeCredibilityFactors(founder.id);

  assert.equal(result.isThinFile, false);
  assert.equal(result.summary, "developing");

  await prisma.backlinkLog.deleteMany({ where: { userId: founder.id } });
  await prisma.badge.deleteMany({ where: { userId: founder.id } });
  await prisma.helpfulVote.deleteMany({ where: { reviewId: { in: allHelpful.map((r) => r.id) } } });
  await prisma.review.deleteMany({ where: { vendorId: vendor.id } });
  await prisma.vendor.deleteMany({ where: { id: vendor.id } });
  const mixedOthers = await prisma.user.findMany({
    where: { email: { contains: `cf-mixed-other-` } },
    select: { id: true },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [...mixedOthers.map((u) => u.id), founder.id] } },
  });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});

test("single review zero helpful", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `CF Single ${suffix}`, slug: `cf-single-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `cf-single-${suffix}@example.com`,
      name: "CF Single",
      cohortId: cohort.id,
      profileCompletePercentage: 80,
    },
  });
  const vendor = await prisma.vendor.create({
    data: { name: `CF Single Vendor ${suffix}`, category: "Legal", cohortId: cohort.id },
  });

  await prisma.review.create({
    data: {
      vendorId: vendor.id,
      userId: founder.id,
      cohortId: cohort.id,
      rating: 5,
      comment: highQualityComment(),
      usedVendor: true,
      createdAt: new Date(Date.now() - 10 * 86400000),
    },
  });

  const result = await computeCredibilityFactors(founder.id);

  assert.equal(result.isThinFile, false);
  assert.equal(result.summary, "developing");
  const rq = result.factors.find((f) => f.key === "reviewQuality");
  assert.equal(rq?.status, "strong");
  const hv = result.factors.find((f) => f.key === "helpfulVotes");
  assert.equal(hv?.status, "needs activity");

  await prisma.review.deleteMany({ where: { vendorId: vendor.id } });
  await prisma.vendor.deleteMany({ where: { id: vendor.id } });
  await prisma.user.deleteMany({ where: { id: founder.id } });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});

test("very old last review", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `CF Old ${suffix}`, slug: `cf-old-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `cf-old-${suffix}@example.com`,
      name: "CF Old",
      cohortId: cohort.id,
      profileCompletePercentage: 100,
    },
  });
  const vendor = await prisma.vendor.create({
    data: { name: `CF Old Vendor ${suffix}`, category: "Legal", cohortId: cohort.id },
  });

  for (let i = 0; i < 5; i++) {
    await prisma.review.create({
      data: {
        vendorId: vendor.id,
        userId: founder.id,
        cohortId: cohort.id,
        rating: 5,
        comment: highQualityComment(),
        usedVendor: true,
        createdAt: new Date(Date.now() - 200 * 86400000),
      },
    });
  }

  const result = await computeCredibilityFactors(founder.id);

  const rr = result.factors.find((f) => f.key === "reviewRecency");
  assert.equal(rr?.status, "needs activity");

  await prisma.review.deleteMany({ where: { vendorId: vendor.id } });
  await prisma.vendor.deleteMany({ where: { id: vendor.id } });
  await prisma.user.deleteMany({ where: { id: founder.id } });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});

test("boundary thin file one review", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `CF Boundary ${suffix}`, slug: `cf-boundary-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `cf-boundary-${suffix}@example.com`,
      name: "CF Boundary",
      cohortId: cohort.id,
    },
  });
  const vendor = await prisma.vendor.create({
    data: { name: `CF Boundary Vendor ${suffix}`, category: "Legal", cohortId: cohort.id },
  });

  await prisma.review.create({
    data: {
      vendorId: vendor.id,
      userId: founder.id,
      cohortId: cohort.id,
      rating: 3,
      comment: "Okay service.",
      usedVendor: true,
      createdAt: new Date(),
    },
  });

  const result = await computeCredibilityFactors(founder.id);

  assert.equal(result.isThinFile, false);

  await prisma.review.deleteMany({ where: { vendorId: vendor.id } });
  await prisma.vendor.deleteMany({ where: { id: vendor.id } });
  await prisma.user.deleteMany({ where: { id: founder.id } });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});

test("public presenter strips private data", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `CF Pub ${suffix}`, slug: `cf-pub-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `cf-pub-${suffix}@example.com`,
      name: "CF Pub",
      cohortId: cohort.id,
      profileCompletePercentage: 90,
    },
  });
  const vendor = await prisma.vendor.create({
    data: { name: `CF Pub Vendor ${suffix}`, category: "Legal", cohortId: cohort.id },
  });

  await prisma.review.create({
    data: {
      vendorId: vendor.id,
      userId: founder.id,
      cohortId: cohort.id,
      rating: 5,
      comment: highQualityComment(),
      usedVendor: true,
      createdAt: new Date(),
    },
  });

  const result = await computeCredibilityFactors(founder.id);
  const pub = toPublicCredibilityFactors(result);

  assert.equal("summary" in pub, false);
  for (const factor of pub) {
    assert.equal("value" in factor, false);
    assert.equal("privateDescription" in factor, false);
    assert.notEqual(factor.key, "reviewRecency");
    assert.ok(typeof factor.publicDescription === "string");
  }

  await prisma.review.deleteMany({ where: { vendorId: vendor.id } });
  await prisma.vendor.deleteMany({ where: { id: vendor.id } });
  await prisma.user.deleteMany({ where: { id: founder.id } });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});

test("review quality max score", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `CF Max ${suffix}`, slug: `cf-max-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `cf-max-${suffix}@example.com`,
      name: "CF Max",
      cohortId: cohort.id,
    },
  });
  const vendor = await prisma.vendor.create({
    data: { name: `CF Max Vendor ${suffix}`, category: "Legal", cohortId: cohort.id },
  });

  await prisma.review.create({
    data: {
      vendorId: vendor.id,
      userId: founder.id,
      cohortId: cohort.id,
      rating: 5,
      comment: highQualityComment(),
      usedVendor: true,
      createdAt: new Date(),
    },
  });

  const result = await computeCredibilityFactors(founder.id);
  const rq = result.factors.find((f) => f.key === "reviewQuality");

  assert.equal(rq?.status, "strong");

  await prisma.review.deleteMany({ where: { vendorId: vendor.id } });
  await prisma.vendor.deleteMany({ where: { id: vendor.id } });
  await prisma.user.deleteMany({ where: { id: founder.id } });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});
