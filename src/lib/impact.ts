import { prisma } from "./prisma.ts";
import { getLeaderboard } from "./leaderboard.ts";

export type FounderImpactSummary = {
  reviewCount: number;
  helpfulVoteCount: number;
  contributionSignalCount: number;
  profileViewCount: number;
  verifiedBacklinkCount: number;
};

export type CohortImpactContributor = {
  userId: string;
  name: string | null;
  email: string;
  reviewCount: number;
  contributionSignalCount: number;
  helpfulVoteCount: number;
};

export type CohortImpactSummary = {
  founderCount: number;
  activeContributorCount: number;
  reviewCount: number;
  helpfulVoteCount: number;
  contributionSignalCount: number;
  topContributors: CohortImpactContributor[];
};

export async function getFounderImpactSummary(userId: string): Promise<FounderImpactSummary> {
  const [user, reviewIds, contributionSignalCount, verifiedBacklinkCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { profileViewCount: true },
    }),
    prisma.review.findMany({
      where: { userId },
      select: { id: true },
    }),
    prisma.badge.count({ where: { userId } }),
    prisma.backlinkLog.count({ where: { userId, status: "verified" } }),
  ]);

  const helpfulVoteCount = await prisma.helpfulVote.count({
    where: { reviewId: { in: reviewIds.map((review) => review.id) }, value: true },
  });

  return {
    reviewCount: reviewIds.length,
    helpfulVoteCount,
    contributionSignalCount,
    profileViewCount: user?.profileViewCount ?? 0,
    verifiedBacklinkCount,
  };
}

export async function getCohortImpactSummary(cohortId: string): Promise<CohortImpactSummary> {
  const entries = await getLeaderboard(cohortId);
  const reviewIds = await prisma.review.findMany({
    where: { vendor: { cohortId } },
    select: { id: true, userId: true },
  });

  const helpfulVoteCount = await prisma.helpfulVote.count({
    where: { reviewId: { in: reviewIds.map((review) => review.id) }, value: true },
  });
  const helpfulVotesByReview = await prisma.helpfulVote.groupBy({
    by: ["reviewId"],
    where: { reviewId: { in: reviewIds.map((review) => review.id) }, value: true },
    _count: { _all: true },
  });
  const reviewOwnerById = new Map(reviewIds.map((review) => [review.id, review.userId]));
  const helpfulVotesByUserId = new Map<string, number>();
  for (const voteGroup of helpfulVotesByReview) {
    const ownerId = reviewOwnerById.get(voteGroup.reviewId);
    if (!ownerId) continue;
    helpfulVotesByUserId.set(
      ownerId,
      (helpfulVotesByUserId.get(ownerId) ?? 0) + voteGroup._count._all,
    );
  }

  const contributionSignalCount = entries.reduce((sum, entry) => sum + entry.badgeCount, 0);
  const activeContributorCount = entries.filter(
    (entry) => entry.reviewCount > 0 || entry.badgeCount > 0,
  ).length;

  return {
    founderCount: entries.length,
    activeContributorCount,
    reviewCount: reviewIds.length,
    helpfulVoteCount,
    contributionSignalCount,
    topContributors: entries.slice(0, 8).map((entry) => ({
      userId: entry.userId,
      name: entry.name,
      email: entry.email,
      reviewCount: entry.reviewCount,
      contributionSignalCount: entry.badgeCount,
      helpfulVoteCount: helpfulVotesByUserId.get(entry.userId) ?? 0,
    })),
  };
}
