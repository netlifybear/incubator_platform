import assert from "node:assert/strict";
import test from "node:test";
import { inviteStatusLabel } from "./invite-presenter.ts";

const now = new Date("2026-05-28T12:00:00.000Z");
const future = new Date("2026-05-29T12:00:00.000Z");
const past = new Date("2026-05-27T12:00:00.000Z");

test("invite status labels prioritize revoked and accepted states", () => {
  assert.equal(
    inviteStatusLabel({ acceptedAt: now, expiresAt: future, revokedAt: now }, now),
    "Revoked",
  );
  assert.equal(
    inviteStatusLabel({ acceptedAt: now, expiresAt: future, revokedAt: null }, now),
    "Accepted",
  );
});

test("invite status labels open and expired invites", () => {
  assert.equal(
    inviteStatusLabel({ acceptedAt: null, expiresAt: future, revokedAt: null }, now),
    "Open",
  );
  assert.equal(
    inviteStatusLabel({ acceptedAt: null, expiresAt: past, revokedAt: null }, now),
    "Expired",
  );
});
