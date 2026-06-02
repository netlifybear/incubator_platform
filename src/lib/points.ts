import { prisma } from "./prisma.ts";
import { PUBLIC_LEADERBOARD_MIN_FOUNDERS } from "./leaderboard-privacy.ts";
import { reviewContributionPoints } from "./review-quality.ts";

const POINTS_PER_BADGE = 25;
const POINTS_PER_HELPFUL_VOTE = 2;
export { PUBLIC_LEADERBOARD_MIN_FOUNDERS };

export type FounderPoints = {
  total: number;
  breakdown: {
    reviews: number;
    badges: number;
    helpfulVotes: number;
  };
};

export { reviewContributionPoints };

export async function getFounderPoints(userId: string): Promise<FounderPoints> {
  const [reviewsForPoints, badgeCount] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      select: { comment: true, id: true },
    }),
    prisma.contributionTag.count({ where: { userId } }),
  ]);

  const helpfulVoteCount = await prisma.helpfulVote.count({
    where: { reviewId: { in: reviewsForPoints.map((r) => r.id) }, value: true },
  });

  const reviews = reviewsForPoints.reduce(
    (sum, review) => sum + reviewContributionPoints(review.comment),
    0,
  );
  const badges = badgeCount * POINTS_PER_BADGE;
  const helpfulVotes = helpfulVoteCount * POINTS_PER_HELPFUL_VOTE;

  return {
    total: reviews + badges + helpfulVotes,
    breakdown: { reviews, badges, helpfulVotes },
  };
}

export type FounderCohortRank = {
  rank: number;
  total: number;
};

export async function getFounderCohortRank(
  userId: string,
  cohortId: string,
): Promise<FounderCohortRank | null> {
  const allPoints = await getCohortPoints(cohortId);
  const idx = allPoints.findIndex((e) => e.userId === userId);
  if (idx === -1) return null;
  return { rank: idx + 1, total: allPoints.length };
}

export async function getCohortPoints(cohortId: string) {
  const founders = await prisma.user.findMany({
    where: { cohortId, role: "founder" },
    select: { id: true },
  });

  const entries = await Promise.all(
    founders.map(async (f) => {
      const points = await getFounderPoints(f.id);
      return { userId: f.id, ...points };
    }),
  );

  return entries.sort((a, b) => b.total - a.total);
}
