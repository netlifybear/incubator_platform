import { prisma } from "./prisma.ts";

export type ContributionFeedback = {
  helpfulVotesReceived: number;
  targetedQuestionsReceived: number;
  reviewsWritten: number;
  cohortActivityCount: number;
  suggestedNextAction: string | null;
};

export async function getContributionFeedback(
  userId: string,
  cohortId: string,
  opts?: { sinceDays?: number },
): Promise<ContributionFeedback> {
  const sinceDays = opts?.sinceDays ?? 7;
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const founderReviewIds = await prisma.review.findMany({
    where: { userId },
    select: { id: true },
  });
  const reviewIdSet = new Set(founderReviewIds.map((r) => r.id));

  const [helpfulVotesReceived, targetedQuestionsReceived, reviewsWritten, cohortActivityCount] =
    await Promise.all([
      prisma.helpfulVote.count({
        where: {
          reviewId: { in: [...reviewIdSet] },
          value: true,
          createdAt: { gte: since },
        },
      }),
      prisma.vendorRequest.count({
        where: {
          targetUserId: userId,
          createdAt: { gte: since },
        },
      }),
      prisma.review.count({
        where: {
          userId,
          createdAt: { gte: since },
        },
      }),
      prisma.activityEvent.count({
        where: {
          cohortId,
          createdAt: { gte: since },
        },
      }),
    ]);

  let suggestedNextAction: string | null = null;
  if (reviewsWritten === 0) {
    suggestedNextAction = "Write a vendor review to start building visible impact.";
  } else if (helpfulVotesReceived === 0 && targetedQuestionsReceived === 0) {
    suggestedNextAction = "Your reviews are live — check back to see how they help peers.";
  } else if (helpfulVotesReceived > 0) {
    suggestedNextAction = "Founders are finding your reviews useful. Keep sharing detailed experiences.";
  }

  return {
    helpfulVotesReceived,
    targetedQuestionsReceived,
    reviewsWritten,
    cohortActivityCount,
    suggestedNextAction,
  };
}
