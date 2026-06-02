import crypto from "node:crypto";
import { prisma } from "./prisma.ts";
import { getFounderPoints } from "./points.ts";
import { getBadgesForFounder } from "./badges.ts";

function base64url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function getKeyPair(): { publicKey: string; privateKey: string } | null {
  const privateKey = process.env.REPUTATION_PRIVATE_KEY;
  const publicKey = process.env.REPUTATION_PUBLIC_KEY;
  if (privateKey && publicKey) {
    return { publicKey, privateKey };
  }
  return null;
}

function signEd25519(payload: string, privateKeyPem: string): string {
  const key = crypto.createPrivateKey({ key: privateKeyPem, format: "pem", type: "pkcs8" });
  return crypto.sign(null, Buffer.from(payload), key).toString("base64url");
}

function signHmac(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not configured.");
  return secret;
}

export function getReputationPublicKey(): string | null {
  const keyPair = getKeyPair();
  if (keyPair) return keyPair.publicKey;

  const pubKey = process.env.REPUTATION_PUBLIC_KEY;
  if (pubKey) return pubKey;

  return null;
}

export async function generateReputationJWT(userId: string): Promise<string> {
  const [user, points, badges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        startupName: true,
        startupUrl: true,
        bio: true,
        profileSlug: true,
        publicProfileEnabled: true,
        profileViewCount: true,
        lastReviewDate: true,
        createdAt: true,
      },
    }),
    getFounderPoints(userId),
    getBadgesForFounder(userId),
  ]);

  if (!user) throw new Error("User not found.");

  const keyPair = getKeyPair();
  const alg = keyPair ? "Ed25519" : "HS256";
  const now = Math.floor(Date.now() / 1000);
  const issuer = process.env.REPUTATION_ISSUER ?? process.env.NEXTAUTH_URL ?? "https://incubator-trust.vercel.app";

  const header = { alg, typ: "JWT" };
  const payload: Record<string, unknown> = {
    iss: issuer,
    sub: user.id,
    iat: now,
    exp: now + 86400,
    profile: {
      name: user.name,
      email: user.email,
      startupName: user.startupName,
      startupUrl: user.startupUrl,
      bio: user.bio,
      profileSlug: user.profileSlug,
      publicProfileEnabled: user.publicProfileEnabled,
      profileViewCount: user.profileViewCount,
      lastReviewDate: user.lastReviewDate?.toISOString() ?? null,
      memberSince: user.createdAt.toISOString(),
    },
    reputation: {
      totalPoints: points.total,
      breakdown: points.breakdown,
    },
    badges: badges.map((b) => ({
      type: b.type,
      label: b.label,
      icon: b.icon,
      earnedAt: b.earnedAt?.toISOString?.() ?? b.earnedAt,
      issuerType: b.issuerType,
    })),
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const signature = keyPair
    ? signEd25519(signingInput, keyPair.privateKey)
    : signHmac(signingInput, getSecret());

  return `${signingInput}.${signature}`;
}

export async function verifyReputationJWT(token: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf-8"));
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    const alg: string = header.alg;
    const signingInput = `${parts[0]}.${parts[1]}`;
    const signature = parts[2];

    if (alg === "Ed25519") {
      const issuer = payload.iss as string | undefined;
      if (!issuer) return null;

      const publicKey = await fetchPublicKey(issuer);
      if (!publicKey) return null;

      const key = crypto.createPublicKey({ key: publicKey, format: "pem", type: "spki" });
      const valid = crypto.verify(null, Buffer.from(signingInput), key, Buffer.from(signature, "base64url"));
      if (!valid) return null;
    } else if (alg === "HS256") {
      const secret = getSecret();
      const expected = signHmac(signingInput, secret);
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    } else {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function fetchPublicKey(issuer: string): Promise<string | null> {
  const wellKnownUrl = `${issuer.replace(/\/$/, "")}/.well-known/reputation-public-key`;

  try {
    const response = await fetch(wellKnownUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const text = await response.text();
    if (!text.includes("BEGIN PUBLIC KEY")) return null;
    return text;
  } catch {
    return null;
  }
}
