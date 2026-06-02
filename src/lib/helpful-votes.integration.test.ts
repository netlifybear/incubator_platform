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
import { getVoteCounts, toggleVote } from "./helpful-votes.ts";

test("alumni can vote on cohort reviews", async () => {
  const run = testRunId("alumni-vote");
  const cohort = await createTestCohort(`${run}-cohort`);
  const alumni = await createTestFounder({
    cohortId: cohort.id,
    email: `${run}-alumni@example.com`,
    role: "alumni",
  });
  const author = await createTestFounder({
    cohortId: cohort.id,
    email: `${run}-author@example.com`,
  });
  const vendor = await createTestVendor({ cohortId: cohort.id, name: `${run} Vendor` });
  const review = await createTestReview({
    cohortId: cohort.id,
    userId: author.id,
    vendorId: vendor.id,
  });

  try {
    assert.deepEqual(
      await toggleVote({ reviewId: review.id, userId: alumni.id, cohortId: cohort.id, value: true }),
      { count: 1, voted: true },
    );
    assert.deepEqual(await getVoteCounts(review.id), { up: 1, down: 0 });
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug],
      emails: [alumni.email, author.email],
    });
  }
});

test("helpful votes allow same-cohort voting, toggling, and direction updates", async () => {
  const run = testRunId("votes");
  const cohort = await createTestCohort(`${run}-cohort`);
  const author = await createTestFounder({
    cohortId: cohort.id,
    email: `${run}-author@example.com`,
  });
  const voter = await createTestFounder({
    cohortId: cohort.id,
    email: `${run}-voter@example.com`,
  });
  const vendor = await createTestVendor({ cohortId: cohort.id, name: `${run} Vendor` });
  const review = await createTestReview({
    cohortId: cohort.id,
    userId: author.id,
    vendorId: vendor.id,
  });

  try {
    assert.deepEqual(
      await toggleVote({ reviewId: review.id, userId: voter.id, cohortId: cohort.id, value: true }),
      { count: 1, voted: true },
    );
    assert.deepEqual(await getVoteCounts(review.id), { up: 1, down: 0 });

    assert.deepEqual(
      await toggleVote({ reviewId: review.id, userId: voter.id, cohortId: cohort.id, value: false }),
      { count: -1, voted: true },
    );
    assert.deepEqual(await getVoteCounts(review.id), { up: 0, down: 1 });

    assert.deepEqual(
      await toggleVote({ reviewId: review.id, userId: voter.id, cohortId: cohort.id, value: false }),
      { count: 0, voted: false },
    );
    assert.deepEqual(await getVoteCounts(review.id), { up: 0, down: 0 });
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug],
      emails: [author.email, voter.email],
    });
  }
});

test("helpful votes reject cross-cohort voting and self-voting", async () => {
  const run = testRunId("vote-guards");
  const cohort = await createTestCohort(`${run}-cohort-a`);
  const otherCohort = await createTestCohort(`${run}-cohort-b`);
  const author = await createTestFounder({
    cohortId: cohort.id,
    email: `${run}-author@example.com`,
  });
  const voter = await createTestFounder({
    cohortId: otherCohort.id,
    email: `${run}-voter@example.com`,
  });
  const vendor = await createTestVendor({ cohortId: cohort.id, name: `${run} Vendor` });
  const review = await createTestReview({
    cohortId: cohort.id,
    userId: author.id,
    vendorId: vendor.id,
  });

  try {
    await assert.rejects(
      toggleVote({
        reviewId: review.id,
        userId: voter.id,
        cohortId: otherCohort.id,
        value: true,
      }),
      /Review not found in your cohort/,
    );

    await assert.rejects(
      toggleVote({
        reviewId: review.id,
        userId: author.id,
        cohortId: cohort.id,
        value: true,
      }),
      /cannot vote on your own review/,
    );
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug, otherCohort.slug],
      emails: [author.email, voter.email],
    });
  }
});
