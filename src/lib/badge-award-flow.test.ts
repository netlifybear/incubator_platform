import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "./prisma.ts";
import {
  cleanupTestData,
  createTestCohort,
  createTestFounder,
  createTestVendor,
  testRunId,
} from "./test-db.ts";
import { handleExternalBadgeAward } from "./badge-award-flow.ts";
import { fingerprintIssuerSecret, hashIssuerSecret } from "./issuer-secrets.ts";

test("external badge award failures are logged without raw secrets and rate-limited", async () => {
  const secret = `${testRunId("badge-secret")}-long`;
  const secretHash = fingerprintIssuerSecret(secret);

  try {
    for (let i = 0; i < 5; i++) {
      const result = await handleExternalBadgeAward({
        body: {
          badgeType: "vendor_endorsed",
          founderEmail: "missing@example.com",
          secret,
        },
        issuerType: "vendor",
      });
      assert.equal(result.status, 401);
    }

    const limited = await handleExternalBadgeAward({
      body: {
        badgeType: "vendor_endorsed",
        founderEmail: "missing@example.com",
        secret,
      },
      issuerType: "vendor",
    });
    assert.equal(limited.status, 429);

    const attempts = await prisma.badgeAwardAttempt.findMany({
      where: { secretHash },
      orderBy: { createdAt: "asc" },
    });
    assert.equal(attempts.length, 6);
    assert(attempts.every((attempt) => attempt.secretHash !== secret));
    assert(attempts.every((attempt) => attempt.success === false));
  } finally {
    await cleanupTestData({ issuerSecretHashes: [secretHash] });
  }
});

test("external badge awards accept valid secrets and reject wrong issuer badge classes", async () => {
  const run = testRunId("badge-award");
  const cohort = await createTestCohort(`${run}-cohort`);
  const founder = await createTestFounder({
    cohortId: cohort.id,
    email: `${run}-founder@example.com`,
  });
  const secret = `${run}-valid-secret`;
  const secretHash = fingerprintIssuerSecret(secret);
  await createTestVendor({
    badgeAwardSecret: hashIssuerSecret(secret),
    cohortId: cohort.id,
    name: `${run} Vendor`,
  });

  try {
    const wrongClass = await handleExternalBadgeAward({
      body: {
        badgeType: "investor_backed",
        founderEmail: founder.email,
        secret,
      },
      issuerType: "vendor",
    });
    assert.equal(wrongClass.status, 400);

    const success = await handleExternalBadgeAward({
      body: {
        badgeType: "vendor_endorsed",
        founderEmail: founder.email,
        secret,
      },
      issuerType: "vendor",
    });
    assert.equal(success.status, 200);

    const badge = await prisma.badge.findFirst({
      where: { issuerType: "vendor", type: "vendor_endorsed", userId: founder.id },
    });
    assert.ok(badge);

    const attempts = await prisma.badgeAwardAttempt.findMany({
      where: { secretHash },
      orderBy: { createdAt: "asc" },
    });
    assert.deepEqual(attempts.map((attempt) => attempt.success), [false, true]);
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug],
      emails: [founder.email],
      issuerSecretHashes: [secretHash],
    });
  }
});
