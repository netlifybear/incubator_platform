import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "./prisma.ts";
import {
  cleanupTestData,
  createTestCohort,
  createTestFounder,
  testRunId,
} from "./test-db.ts";
import { addBacklink, snapshotBacklinks, getBacklinkSnapshots } from "./backlinks.ts";

test("snapshot records current backlink counts", async () => {
  const run = testRunId("snapshot");
  const cohort = await createTestCohort(`${run}-cohort`);
  const founder = await createTestFounder({
    cohortId: cohort.id,
    email: `${run}-founder@example.com`,
  });

  try {
    await addBacklink({ userId: founder.id, referringDomain: "verified-example.com" });
    await addBacklink({ userId: founder.id, referringDomain: "lost-example.com" });
    await addBacklink({ userId: founder.id, referringDomain: "pending-example.com" });

    await prisma.backlinkLog.updateMany({
      where: { userId: founder.id, referringDomain: "verified-example.com" },
      data: { status: "verified" },
    });
    await prisma.backlinkLog.updateMany({
      where: { userId: founder.id, referringDomain: "lost-example.com" },
      data: { status: "lost" },
    });

    await snapshotBacklinks(founder.id);
    const snapshots = await getBacklinkSnapshots(founder.id);

    assert.equal(snapshots.length, 1);
    assert.equal(snapshots[0].verifiedCount, 1);
    assert.equal(snapshots[0].lostCount, 1);
    assert.equal(snapshots[0].pendingCount, 1);
    assert.equal(snapshots[0].reachableCount, 0);
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug],
      emails: [founder.email],
    });
  }
});

test("multiple snapshots accumulate for same user", async () => {
  const run = testRunId("snapshot-acc");
  const cohort = await createTestCohort(`${run}-cohort`);
  const founder = await createTestFounder({
    cohortId: cohort.id,
    email: `${run}-founder@example.com`,
  });

  try {
    await addBacklink({ userId: founder.id, referringDomain: "example-a.com" });
    await snapshotBacklinks(founder.id);

    await addBacklink({ userId: founder.id, referringDomain: "example-b.com" });
    await snapshotBacklinks(founder.id);

    const snapshots = await getBacklinkSnapshots(founder.id);
    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[1].pendingCount, 2);
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug],
      emails: [founder.email],
    });
  }
});

test("snapshot with no backlinks creates zero-count entry", async () => {
  const run = testRunId("snapshot-zero");
  const cohort = await createTestCohort(`${run}-cohort`);
  const founder = await createTestFounder({
    cohortId: cohort.id,
    email: `${run}-founder@example.com`,
  });

  try {
    await snapshotBacklinks(founder.id);
    const snapshots = await getBacklinkSnapshots(founder.id);

    assert.equal(snapshots.length, 1);
    assert.equal(snapshots[0].verifiedCount, 0);
    assert.equal(snapshots[0].lostCount, 0);
    assert.equal(snapshots[0].pendingCount, 0);
    assert.equal(snapshots[0].reachableCount, 0);
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug],
      emails: [founder.email],
    });
  }
});
