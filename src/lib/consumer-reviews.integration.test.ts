import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanupTestData,
  createTestCohort,
  createTestVendor,
  testRunId,
} from "./test-db.ts";
import { createConsumerReview } from "./consumer-reviews.ts";
import { getConsumerReviewsForVendor } from "./vendors.ts";

test("consumer review creates and queries a review", async () => {
  const run = testRunId("consumer-review");
  const cohort = await createTestCohort(`${run}-cohort`);
  const vendor = await createTestVendor({ cohortId: cohort.id, name: `${run} Vendor` });

  try {
    await createConsumerReview({
      vendorId: vendor.id,
      cohortId: cohort.id,
      rating: 4,
      comment: "Great service, quick turnaround.",
      displayName: "Test User",
    });

    const reviews = await getConsumerReviewsForVendor(vendor.id);
    assert.equal(reviews.length, 1);
    assert.equal(reviews[0].rating, 4);
    assert.equal(reviews[0].comment, "Great service, quick turnaround.");
    assert.equal(reviews[0].displayName, "Test User");
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug],
      emails: [],
    });
  }
});

test("consumer review allows anonymous (null displayName)", async () => {
  const run = testRunId("consumer-anon");
  const cohort = await createTestCohort(`${run}-cohort`);
  const vendor = await createTestVendor({ cohortId: cohort.id, name: `${run} Vendor` });

  try {
    await createConsumerReview({
      vendorId: vendor.id,
      cohortId: cohort.id,
      rating: 5,
      comment: null,
      displayName: null,
    });

    const reviews = await getConsumerReviewsForVendor(vendor.id);
    assert.equal(reviews.length, 1);
    assert.equal(reviews[0].rating, 5);
    assert.equal(reviews[0].displayName, null);
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug],
      emails: [],
    });
  }
});

test("consumer reviews are scoped to vendor", async () => {
  const run = testRunId("consumer-scope");
  const cohort = await createTestCohort(`${run}-cohort`);
  const vendorA = await createTestVendor({ cohortId: cohort.id, name: `${run} A` });
  const vendorB = await createTestVendor({ cohortId: cohort.id, name: `${run} B` });

  try {
    await createConsumerReview({ vendorId: vendorA.id, cohortId: cohort.id, rating: 3, comment: null, displayName: null });
    await createConsumerReview({ vendorId: vendorB.id, cohortId: cohort.id, rating: 5, comment: "Great", displayName: "Alice" });

    const reviewsA = await getConsumerReviewsForVendor(vendorA.id);
    assert.equal(reviewsA.length, 1);
    assert.equal(reviewsA[0].rating, 3);

    const reviewsB = await getConsumerReviewsForVendor(vendorB.id);
    assert.equal(reviewsB.length, 1);
    assert.equal(reviewsB[0].rating, 5);
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug],
      emails: [],
    });
  }
});
