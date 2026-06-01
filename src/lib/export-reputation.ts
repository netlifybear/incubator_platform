import { createHash, createHmac } from "node:crypto";
import { prisma } from "./prisma.ts";
import { getFounderPoints } from "./points.ts";
import { getBadgesForFounder } from "./badges.ts";

function base64url(input: string) {
  return Buffer.from(input)
    .toString("base64url");
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not configured.");
  return secret;
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

  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: "incubator-trust",
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
      earnedAt: b.earnedAt.toISOString(),
      issuerType: b.issuerType,
    })),
  };

  const secret = getSecret();
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signature = sign(`${headerB64}.${payloadB64}`, secret);

  return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifyReputationJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const secret = getSecret();
    const expectedSig = sign(`${parts[0]}.${parts[1]}`, secret);
    if (!safeCompare(parts[2], expectedSig)) return null;

    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return createHash("sha256").update(a).digest().equals(createHash("sha256").update(b).digest());
}
