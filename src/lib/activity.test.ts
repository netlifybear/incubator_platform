import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "./prisma.ts";
import { recordActivity, getCohortActivity } from "./activity.ts";
import { createTestCohort, createTestFounder, cleanupTestData, testRunId } from "./test-db.ts";

describe("activity events", () => {
  const runId = testRunId("activity");
  let cohortId: string;
  let userId: string;

  before(async () => {
    const cohort = await createTestCohort(`activity-${runId}`);
    cohortId = cohort.id;
    const user = await createTestFounder({ cohortId, email: `activity-${runId}@test.com`, name: "Activity Tester" });
    userId = user.id;
  });

  after(async () => {
    await cleanupTestData({ cohortSlugs: [`activity-${runId}`], emails: [`activity-${runId}@test.com`] });
  });

  it("records an activity event", async () => {
    const event = await recordActivity({
      userId,
      cohortId,
      type: "review_written",
      metadata: { vendorName: "TestVendor" },
    });

    assert.ok(event.id);
    assert.equal(event.type, "review_written");
    assert.equal((event.metadata as Record<string, string>).vendorName, "TestVendor");
  });

  it("getCohortActivity returns events most recent first", async () => {
    await recordActivity({ userId, cohortId, type: "tag_earned", metadata: { tagType: "early-adopter" } });
    const events = await getCohortActivity(cohortId);
    assert.ok(events.length >= 2);
    assert.equal(events[0].type, "tag_earned");
    assert.equal(events[1].type, "review_written");
  });

  it("getCohortActivity excludes other cohorts", async () => {
    const otherCohort = await createTestCohort(`activity-other-${runId}`);
    const events = await getCohortActivity(otherCohort.id);
    assert.equal(events.length, 0);
    await prisma.cohort.delete({ where: { id: otherCohort.id } }).catch(() => {});
  });
});
