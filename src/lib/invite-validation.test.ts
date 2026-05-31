import assert from "node:assert/strict";
import test from "node:test";
import {
  getInviteExpirationDate,
  normalizeInviteEmail,
} from "./invite-validation.ts";

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
