import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  cleanupTestData,
  createTestCohort,
  createTestFounder,
  createTestReview,
  createTestVendor,
  testRunId,
} from "./test-db.ts";
import { prisma } from "./prisma.ts";
import { getCrossCohortRecommendations, getSimilarVendorsInOtherCohorts } from "./vendors.ts";

type CrossCohortVendor = {
  id: string;
  name: string;
  category: string;
  cohortName: string;
  cohortSlug: string;
  reviewCount: number;
  avgRating: number;
};

const PUBLIC_FIELDS = ["id", "name", "category", "cohortName", "cohortSlug", "reviewCount", "avgRating"];

describe("cross-cohort vendor recommendations", () => {
  const runId = testRunId("xcohort");
  let cohortA: { id: string; slug: string };
  let cohortB: { id: string; slug: string };
  let founderB: { id: string };

  before(async () => {
    cohortA = await createTestCohort(`xa-${runId}`);
    cohortB = await createTestCohort(`xb-${runId}`);
    await createTestFounder({ cohortId: cohortA.id, email: `fa-${runId}@test.com` });
    founderB = await createTestFounder({ cohortId: cohortB.id, email: `fb-${runId}@test.com` });
  });

  after(async () => {
    await cleanupTestData({
      cohortSlugs: [`xa-${runId}`, `xb-${runId}`],
      emails: [`fa-${runId}@test.com`, `fb-${runId}@test.com`],
    });
  });

  describe("getCrossCohortRecommendations", () => {
    let vendorB: { id: string };
    let vendorC: { id: string };

    before(async () => {
      await createTestVendor({ cohortId: cohortA.id, name: `A-Vendor ${runId}` });
      vendorB = await createTestVendor({ cohortId: cohortB.id, name: `B-Vendor ${runId}` });
      vendorC = await createTestVendor({ cohortId: cohortB.id, name: `C-Vendor ${runId}` });
    });

    it("excludes the current cohort from results", async () => {
      await createTestReview({ cohortId: cohortB.id, userId: founderB.id, vendorId: vendorB.id, rating: 5 });
      await createTestReview({ cohortId: cohortB.id, userId: founderB.id, vendorId: vendorB.id, rating: 4 });
      await createTestReview({ cohortId: cohortB.id, userId: founderB.id, vendorId: vendorC.id, rating: 3 });

      const resultA = await getCrossCohortRecommendations(cohortA.id);
      // vendorA is in cohortA, should not appear
      for (const v of resultA) {
        assert.notEqual(v.cohortSlug, cohortA.slug);
      }

      const resultB = await getCrossCohortRecommendations(cohortB.id);
      // vendorB/vendorC are in cohortB, should not appear
      for (const v of resultB) {
        assert.notEqual(v.cohortSlug, cohortB.slug);
      }
    });

    it("filters out vendors with average rating below 3.5", async () => {
      // vendorB has two reviews: 5+4=9, avg=4.5 >= 3.5 ✓
      // vendorC has one review: 3, avg=3.0 < 3.5 ✗
      const result = await getCrossCohortRecommendations(cohortA.id);
      const names = result.map((v: CrossCohortVendor) => v.name);
      assert.ok(names.includes(`B-Vendor ${runId}`));
      assert.ok(!names.includes(`C-Vendor ${runId}`));
      assert.ok(!names.includes(`A-Vendor ${runId}`));
    });

    it("returns only public-safe fields — no review text, no founder data, no admin data", async () => {
      const result = await getCrossCohortRecommendations(cohortA.id);
      for (const v of result) {
        const keys = Object.keys(v).sort();
        assert.deepEqual(keys, [...PUBLIC_FIELDS].sort());
        assert.equal(typeof v.name, "string");
        assert.equal(typeof v.category, "string");
        assert.equal(typeof v.cohortName, "string");
        assert.equal(typeof v.cohortSlug, "string");
        assert.equal(typeof v.reviewCount, "number");
        assert.equal(typeof v.avgRating, "number");
        assert.ok(v.avgRating >= 3.5);
      }
    });

    it("sorts deterministically by review count descending", async () => {
      const result = await getCrossCohortRecommendations(cohortA.id);
      for (let i = 1; i < result.length; i++) {
        assert.ok(result[i - 1].reviewCount >= result[i].reviewCount);
      }
    });
  });

  describe("getSimilarVendorsInOtherCohorts", () => {
    const uniqueCategory = `XCategory-${runId}`;
    let sourceVendor: { id: string };

    before(async () => {
      sourceVendor = await prisma.vendor.create({
        data: {
          cohortId: cohortA.id,
          name: `Source ${runId}`,
          category: uniqueCategory,
        },
      });
    });

    it("returns empty for a vendor with no matching category in other cohorts", async () => {
      const result = await getSimilarVendorsInOtherCohorts(sourceVendor.id, cohortA.id);
      assert.equal(result.length, 0);
    });

    it("returns same-category vendors from other cohorts with good ratings", async () => {
      const similar = await prisma.vendor.create({
        data: { cohortId: cohortB.id, name: `Similar ${runId}`, category: uniqueCategory },
      });
      await prisma.vendor.create({
        data: { cohortId: cohortB.id, name: `Unrelated ${runId}`, category: "OtherCategory" },
      });

      await createTestReview({ cohortId: cohortB.id, userId: founderB.id, vendorId: similar.id, rating: 5 });

      const result = await getSimilarVendorsInOtherCohorts(sourceVendor.id, cohortA.id);
      assert.ok(result.length >= 1);
      const names = result.map((v: CrossCohortVendor) => v.name);
      assert.ok(names.includes(`Similar ${runId}`), `Expected Similar ${runId} in results: ${names.join(", ")}`);
      assert.ok(!names.includes(`Unrelated ${runId}`));
      assert.ok(!names.includes(`Source ${runId}`));
    });

    it("returns only public-safe fields — no review text, no founder data", async () => {
      const result = await getSimilarVendorsInOtherCohorts(sourceVendor.id, cohortA.id);
      for (const v of result) {
        const keys = Object.keys(v).sort();
        assert.deepEqual(keys, [...PUBLIC_FIELDS].sort());
        assert.ok(v.avgRating >= 3.5);
        assert.equal(typeof v.name, "string");
        assert.equal(typeof v.category, "string");
        assert.equal(typeof v.cohortName, "string");
        assert.equal(typeof v.cohortSlug, "string");
        assert.equal(typeof v.reviewCount, "number");
      }
    });
  });
});
