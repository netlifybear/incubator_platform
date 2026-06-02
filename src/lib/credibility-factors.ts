import { prisma } from "./prisma.ts";
import { getFounderImpactSummary } from "./impact.ts";
import { reviewContributionPoints } from "./review-quality.ts";

const MAX_QUALITY_POINTS = 10;

export type FactorLabel = "strong" | "developing" | "needs activity";

export type CredibilityFactorKey =
  | "reviewQuality"
  | "helpfulVotes"
  | "contributionSignals"
  | "reviewRecency"
  | "profileCompleteness"
  | "verifiedBacklinks";

export type CredibilityFactor = {
  key: CredibilityFactorKey;
  label: string;
  value: string | number;
  status: FactorLabel;
  privateDescription: string;
  publicDescription: string;
  isPublic: boolean;
};

export type CredibilityFactors = {
  factors: CredibilityFactor[];
  summary: FactorLabel;
  isThinFile: boolean;
};

const cache = new Map<string, { data: CredibilityFactors; at: number }>();
const CACHE_TTL = 60_000;

function factorLabel(value: number, strong: number, developing: number): FactorLabel {
  if (value >= strong) return "strong";
  if (value >= developing) return "developing";
  return "needs activity";
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

function timeAgo(days: number): string {
  if (days <= 1) return "today";
  if (days <= 30) return `${days} days ago`;
  if (days <= 90) return `${Math.floor(days / 7)} weeks ago`;
  return "over 3 months ago";
}

function computeOverallSummary(factors: CredibilityFactor[], isThinFile: boolean): FactorLabel {
  if (isThinFile) return "needs activity";
  const scoreMap: Record<FactorLabel, number> = { strong: 3, developing: 2, "needs activity": 1 };
  const avg =
    factors.reduce((sum, f) => sum + scoreMap[f.status], 0) / factors.length;
  if (avg >= 2.5) return "strong";
  if (avg >= 1.5) return "developing";
  return "needs activity";
}

export type PublicCredibilityFactor = {
  key: CredibilityFactorKey;
  label: string;
  status: FactorLabel;
  publicDescription: string;
};

export function toPublicCredibilityFactors(result: CredibilityFactors): PublicCredibilityFactor[] {
  return result.factors
    .filter((f) => f.isPublic && f.key !== "reviewRecency")
    .map((f) => ({
      key: f.key,
      label: f.label,
      status: f.status,
      publicDescription: f.publicDescription,
    }));
}

export async function computeCredibilityFactors(
  userId: string,
  opts?: { impact?: Awaited<ReturnType<typeof getFounderImpactSummary>>; useCache?: boolean },
): Promise<CredibilityFactors> {
  if (opts?.useCache) {
    const cached = cache.get(userId);
    if (cached && Date.now() - cached.at < CACHE_TTL) return cached.data;
  }

  const impact = opts?.impact ?? (await getFounderImpactSummary(userId));

  const [reviews, user] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      select: { comment: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { profileCompletePercentage: true },
    }),
  ]);

  const reviewCount = reviews.length;
  const isThinFile = reviewCount === 0
    && impact.contributionSignalCount === 0
    && impact.helpfulVoteCount === 0
    && impact.verifiedBacklinkCount === 0;

  const avgQuality =
    reviewCount > 0
      ? Math.round(
          reviews.reduce(
            (sum, r) =>
              sum + (reviewContributionPoints(r.comment) / MAX_QUALITY_POINTS) * 100,
            0,
          ) / reviewCount,
        )
      : 0;

  const helpfulRatio =
    reviewCount > 0
      ? Math.round((impact.helpfulVoteCount / reviewCount) * 10) / 10
      : 0;

  const lastReviewDate = reviews[0]?.createdAt ?? null;
  const recencyDays = lastReviewDate ? daysSince(lastReviewDate) : null;

  const profileComplete = user?.profileCompletePercentage ?? 0;

  const factors: CredibilityFactor[] = [
    {
      key: "reviewQuality",
      label: "Review quality",
      value: `${avgQuality}%`,
      status: factorLabel(avgQuality, 80, 50),
      privateDescription: `Your reviews average ${avgQuality}% quality.`,
      publicDescription: "Reviews show consistent quality.",
      isPublic: true,
    },
    {
      key: "helpfulVotes",
      label: "Helpful votes",
      value: `${helpfulRatio}x per review`,
      status: factorLabel(helpfulRatio, 1.0, 0.5),
      privateDescription: `${helpfulRatio}x helpful votes per review from peers.`,
      publicDescription: "Peers find the reviews helpful.",
      isPublic: true,
    },
    {
      key: "contributionSignals",
      label: "Contribution signals",
      value: `${impact.contributionSignalCount}`,
      status: factorLabel(impact.contributionSignalCount, 3, 1),
      privateDescription: `${impact.contributionSignalCount} contribution signals earned.`,
      publicDescription: "Has contribution signals from badges.",
      isPublic: true,
    },
    {
      key: "reviewRecency",
      label: "Review recency",
      value: recencyDays !== null ? timeAgo(recencyDays) : "No reviews yet",
      status:
        recencyDays !== null ? factorLabel(30 - recencyDays, 0, -60) : "needs activity",
      privateDescription:
        recencyDays !== null
          ? `Last review was ${timeAgo(recencyDays)}.`
          : "No reviews yet.",
      publicDescription: "",
      isPublic: false,
    },
    {
      key: "profileCompleteness",
      label: "Profile completeness",
      value: `${profileComplete}%`,
      status: factorLabel(profileComplete, 80, 50),
      privateDescription: `Your profile is ${profileComplete}% complete.`,
      publicDescription: "Profile is substantially complete.",
      isPublic: true,
    },
    {
      key: "verifiedBacklinks",
      label: "Verified backlinks",
      value: `${impact.verifiedBacklinkCount}`,
      status: factorLabel(impact.verifiedBacklinkCount, 3, 1),
      privateDescription: `${impact.verifiedBacklinkCount} verified backlinks pointing to your startup.`,
      publicDescription: "Has verified external references.",
      isPublic: true,
    },
  ];

  const summary = computeOverallSummary(factors, isThinFile);

  const result: CredibilityFactors = { factors, summary, isThinFile };

  if (opts?.useCache) {
    cache.set(userId, { data: result, at: Date.now() });
  }

  return result;
}
