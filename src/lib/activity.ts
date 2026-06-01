import { prisma } from "./prisma.ts";
import type { Prisma } from "@prisma/client";

export type ActivityType =
  | "review_written"
  | "consumer_review_written"
  | "badge_earned"
  | "exchange_completed"
  | "request_answered"
  | "helpful_vote_received";

export async function recordActivity(params: {
  userId: string;
  cohortId: string;
  type: ActivityType;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.activityEvent.create({
    data: {
      userId: params.userId,
      cohortId: params.cohortId,
      type: params.type,
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function getCohortActivity(cohortId: string, limit = 20) {
  return prisma.activityEvent.findMany({
    where: { cohortId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}
