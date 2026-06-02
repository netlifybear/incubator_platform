import { prisma } from "./prisma.ts";

const TAG_AWARD_WINDOW_MS = 15 * 60 * 1000;
const TAG_AWARD_FAILURE_LIMIT = 5;

export type TagAwardIssuerType = "vendor" | "investor";

export async function isTagAwardRateLimited(
  issuerType: TagAwardIssuerType,
  secretHash: string,
  now = new Date(),
) {
  const windowStart = new Date(now.getTime() - TAG_AWARD_WINDOW_MS);
  const failedAttempts = await prisma.tagAwardAttempt.count({
    where: {
      issuerType,
      secretHash,
      success: false,
      createdAt: { gte: windowStart },
    },
  });

  return failedAttempts >= TAG_AWARD_FAILURE_LIMIT;
}

export async function recordTagAwardAttempt(input: {
  error?: string;
  ipAddress?: string | null;
  issuerType: TagAwardIssuerType;
  secretHash: string;
  success: boolean;
}) {
  return prisma.tagAwardAttempt.create({
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
