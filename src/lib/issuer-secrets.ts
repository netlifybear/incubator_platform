import crypto from "node:crypto";

const HASH_PREFIX = "issuer-secret:v1";
const ATTEMPT_PREFIX = "issuer-attempt:v1";

function issuerSecretPepper() {
  return (
    process.env.ISSUER_SECRET_PEPPER ??
    process.env.NEXTAUTH_SECRET ??
    "dev-issuer-secret-pepper"
  );
}

export function hashIssuerSecret(secret: string, pepper = issuerSecretPepper()) {
  const normalizedSecret = secret.trim();

  if (normalizedSecret.length < 12) {
    throw new Error("Issuer award secrets must be at least 12 characters.");
  }

  const digest = crypto
    .createHmac("sha256", pepper)
    .update(normalizedSecret)
    .digest("base64url");

  return `${HASH_PREFIX}:${digest}`;
}

export function fingerprintIssuerSecret(
  secret: string,
  pepper = issuerSecretPepper(),
) {
  const digest = crypto
    .createHmac("sha256", pepper)
    .update(secret.trim())
    .digest("base64url");

  return `${ATTEMPT_PREFIX}:${digest}`;
}

export function isHashedIssuerSecret(value: string | null | undefined) {
  return typeof value === "string" && value.startsWith(`${HASH_PREFIX}:`);
}

export function verifyIssuerSecret(
  secret: string,
  hashedSecret: string | null | undefined,
  pepper = issuerSecretPepper(),
) {
  if (typeof hashedSecret !== "string" || !isHashedIssuerSecret(hashedSecret)) {
    return false;
  }

  const candidate = hashIssuerSecret(secret, pepper);
  return crypto.timingSafeEqual(
    Buffer.from(candidate),
    Buffer.from(hashedSecret),
  );
}
