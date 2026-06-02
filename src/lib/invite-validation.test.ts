import assert from "node:assert/strict";
import test from "node:test";
import { createInviteForCohort, acceptInviteByToken } from "./invites.ts";
import {
  getInviteExpirationDate,
  normalizeInviteEmail,
} from "./invite-validation.ts";
import { prisma } from "./prisma.ts";
import { cleanupTestData, createTestCohort, testRunId } from "./test-db.ts";

test("invite emails are normalized and must look like emails", () => {
  assert.equal(normalizeInviteEmail("  FOUNDER@Example.COM  "), "founder@example.com");
  assert.throws(() => normalizeInviteEmail("not-an-email"), /valid email/);
});

test("invite expiration is seven days after creation", () => {
  const createdAt = new Date("2026-05-28T12:00:00.000Z");

  assert.equal(
    getInviteExpirationDate(createdAt).toISOString(),
    "2026-06-04T12:00:00.000Z",
  );
});

test("accepting an invite requires the signed-in invited email", async () => {
  const run = testRunId("invite-accept");
  const cohort = await createTestCohort(`${run}-cohort`);
  const invitedEmail = `${run}-invited@example.com`;
  const otherEmail = `${run}-other@example.com`;
  const invite = await createInviteForCohort({
    cohortId: cohort.id,
    email: invitedEmail,
  });

  try {
    await assert.rejects(
      acceptInviteByToken(invite.token, otherEmail),
      /invited email address/,
    );

    const accepted = await acceptInviteByToken(invite.token, invitedEmail.toUpperCase());
    assert.equal(accepted.user.email, invitedEmail);
    assert.equal(accepted.user.cohortId, cohort.id);
    assert.equal(accepted.invite.id, invite.id);
    assert.ok(accepted.invite.acceptedAt);

    const otherUser = await prisma.user.findUnique({ where: { email: otherEmail } });
    assert.equal(otherUser, null);
  } finally {
    await cleanupTestData({
      cohortSlugs: [cohort.slug],
      emails: [invitedEmail, otherEmail],
    });
  }
});
