import assert from "node:assert/strict";
import test from "node:test";
import {
  fingerprintIssuerSecret,
  hashIssuerSecret,
  isHashedIssuerSecret,
  verifyIssuerSecret,
} from "./issuer-secrets.ts";

test("issuer secrets are stored as deterministic hashes", () => {
  const hashed = hashIssuerSecret("vendor-secret-123", "test-pepper");

  assert.equal(isHashedIssuerSecret(hashed), true);
  assert.equal(hashed.includes("vendor-secret-123"), false);
  assert.equal(hashed, hashIssuerSecret("vendor-secret-123", "test-pepper"));
});

test("issuer secret verification uses the hash and pepper", () => {
  const hashed = hashIssuerSecret("vendor-secret-123", "test-pepper");

  assert.equal(verifyIssuerSecret("vendor-secret-123", hashed, "test-pepper"), true);
  assert.equal(verifyIssuerSecret("vendor-secret-123", hashed, "wrong-pepper"), false);
  assert.equal(verifyIssuerSecret("wrong-secret-123", hashed, "test-pepper"), false);
  assert.equal(verifyIssuerSecret("vendor-secret-123", "vendor-secret-123", "test-pepper"), false);
});

test("issuer secrets have a minimum length", () => {
  assert.throws(
    () => hashIssuerSecret("short", "test-pepper"),
    /at least 12 characters/,
  );
});

test("issuer secret fingerprints are safe for logging attempts", () => {
  const fingerprint = fingerprintIssuerSecret("short", "test-pepper");

  assert.equal(fingerprint.startsWith("issuer-attempt:v1:"), true);
  assert.equal(fingerprint.includes("short"), false);
  assert.equal(fingerprint, fingerprintIssuerSecret("short", "test-pepper"));
});
