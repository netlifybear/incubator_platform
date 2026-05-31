import { prisma } from "@/lib/prisma";
import { getVoteCounts } from "@/lib/helpful-votes";

export type CohortAnalytics = {
  reviews: {
    total: number;
    avgLength: number;
    pctWithNumbers: number;
    pctWithDisclosure: number;
    pctWithServiceMention: number;
    avgRating: number;
    totalHelpfulVotes: number;
  };
  backlinks: {
    totalDomains: number;
    totalFoundersWithBacklinks: number;
  };
  founders: {
    total: number;
    pctWithPublicProfile: number;
  };
};

const SERVICE_WORDS = [
  "service", "used", "hired", "worked with", "helped",
  "handled", "managed", "provided", "delivered", "did",
  "filed", "prepared", "built", "designed", "developed",
  "consult", "advised", "represented", "fixed", "solved",
  "software", "platform", "tool", "product",
];

function hasServiceMention(text: string): boolean {
  const lower = text.toLowerCase();
  return SERVICE_WORDS.some((w) => lower.includes(w));
}

export async function getCohortAnalytics(cohortId: string): Promise<CohortAnalytics> {
  const cohortUserIds = await prisma.user.findMany({
    where: { cohortId },
    select: { id: true },
  });
  const userIds = cohortUserIds.map((u) => u.id);

  const [reviews, backlinks, founders, reviewIds] = await Promise.all([
    prisma.review.findMany({
      where: { cohortId },
      select: {
        comment: true,
        rating: true,
        disclosedIncentive: true,
      },
    }),
    prisma.backlinkLog.findMany({
      where: { userId: { in: userIds } },
      select: { referringDomain: true, userId: true },
    }),
    prisma.user.findMany({
      where: { cohortId, role: "founder" },
      select: { publicProfileEnabled: true },
    }),
    prisma.review.findMany({
      where: { cohortId },
      select: { id: true },
    }),
  ]);

  const voteData = await Promise.all(
    reviewIds.map((r) => getVoteCounts(r.id)),
  );

  const total = reviews.length;
  const avgLength = total > 0
    ? Math.round(reviews.reduce((s, r) => s + (r.comment?.length ?? 0), 0) / total)
    : 0;
  const pctWithNumbers = total > 0
    ? Math.round((reviews.filter((r) => /\d/.test(r.comment ?? "")).length / total) * 100)
    : 0;
  const pctWithDisclosure = total > 0
    ? Math.round((reviews.filter((r) => r.disclosedIncentive).length / total) * 100)
    : 0;
  const pctWithServiceMention = total > 0
    ? Math.round((reviews.filter((r) => hasServiceMention(r.comment ?? "")).length / total) * 100)
    : 0;
  const avgRating = total > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
    : 0;

  const uniqueBacklinkDomains = new Set(backlinks.map((b) => b.referringDomain)).size;
  const foundersWithBacklinks = new Set(backlinks.map((b) => b.userId)).size;
  const totalFounders = founders.length;
  const pctWithPublicProfile = totalFounders > 0
    ? Math.round((founders.filter((f) => f.publicProfileEnabled).length / totalFounders) * 100)
    : 0;
  const totalHelpfulVotes = voteData.reduce((s, v) => s + v.up + v.down, 0);

  return {
    reviews: {
      total,
      avgLength,
      pctWithNumbers,
      pctWithDisclosure,
      pctWithServiceMention,
      avgRating,
      totalHelpfulVotes,
    },
    backlinks: {
      totalDomains: uniqueBacklinkDomains,
      totalFoundersWithBacklinks: foundersWithBacklinks,
    },
    founders: {
      total: totalFounders,
      pctWithPublicProfile,
    },
  };
}
