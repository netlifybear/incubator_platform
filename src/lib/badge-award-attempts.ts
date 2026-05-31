import { prisma } from "./prisma.ts";

const BADGE_AWARD_WINDOW_MS = 15 * 60 * 1000;
const BADGE_AWARD_FAILURE_LIMIT = 5;

export type BadgeAwardIssuerType = "vendor" | "investor";

export async function isBadgeAwardRateLimited(
  issuerType: BadgeAwardIssuerType,
  secretHash: string,
  now = new Date(),
) {
  const windowStart = new Date(now.getTime() - BADGE_AWARD_WINDOW_MS);
  const failedAttempts = await prisma.badgeAwardAttempt.count({
    where: {
      issuerType,
      secretHash,
      success: false,
      createdAt: { gte: windowStart },
    },
  });

  return failedAttempts >= BADGE_AWARD_FAILURE_LIMIT;
}

export async function recordBadgeAwardAttempt(input: {
  error?: string;
  ipAddress?: string | null;
  issuerType: BadgeAwardIssuerType;
  secretHash: string;
  success: boolean;
}) {
  return prisma.badgeAwardAttempt.create({
    data: {
      error: input.error ?? null,
      ipAddress: input.ipAddress ?? null,
      issuerType: input.issuerType,
      secretHash: input.secretHash,
      success: input.success,
    },
  });
}

export function clientIpFromHeaders(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return headers.get("x-real-ip");
}
