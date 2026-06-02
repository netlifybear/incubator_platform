import { prisma } from "./prisma.ts";
import { getFounderPoints } from "./points.ts";

export type LeaderboardEntry = {
  userId: string;
  name: string | null;
  email: string;
  reviewCount: number;
  badgeCount: number;
  avgRating: number | null;
  points: number;
};

export async function getLeaderboard(cohortId: string): Promise<LeaderboardEntry[]> {
  const founders = await prisma.user.findMany({
    where: { cohortId, role: "founder" },
    select: {
      id: true,
      name: true,
      email: true,
      reviews: {
        select: { rating: true },
      },
      badges: {
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const entries = await Promise.all(
    founders.map(async (f) => {
      const points = await getFounderPoints(f.id);
      return {
        userId: f.id,
        name: f.name,
        email: f.email,
        reviewCount: f.reviews.length,
        badgeCount: f.badges.length,
        avgRating:
          f.reviews.length > 0
            ? f.reviews.reduce((s, r) => s + r.rating, 0) / f.reviews.length
            : null,
        points: points.total,
      };
    }),
  );

  return entries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aScore = a.reviewCount * 2 + a.badgeCount * 3 + (a.avgRating ?? 0);
    const bScore = b.reviewCount * 2 + b.badgeCount * 3 + (b.avgRating ?? 0);
    return bScore - aScore;
  });
}
