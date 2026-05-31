import assert from "node:assert/strict";
import test from "node:test";
import {
  founderProfileSlugFromEmail,
  normalizeFounderProfileSlug,
  publicFounderDisplayName,
} from "./founder-profile-presenter.ts";

test("founder profile slugs normalize to URL-safe lowercase words", () => {
  assert.equal(normalizeFounderProfileSlug(" Maya Chen! "), "maya-chen");
  assert.equal(normalizeFounderProfileSlug("Maya_Chen / AI"), "maya-chen-ai");
  assert.equal(normalizeFounderProfileSlug("---Maya---"), "maya");
});

test("legacy founder profile slug fallback uses a normalized email local part", () => {
  assert.equal(founderProfileSlugFromEmail("Maya.Chen@example.com"), "maya-chen");
});

test("public founder display name never falls back to full email", () => {
  assert.equal(publicFounderDisplayName({ name: "Maya Chen", email: "maya@example.com" }), "Maya Chen");
  assert.equal(publicFounderDisplayName({ name: null, email: "maya@example.com" }), "maya");
  assert.equal(publicFounderDisplayName({ name: null, email: null }), "Founder");
});
