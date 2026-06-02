import { contributionTagDefinition, listAwardableTagTypes as listAwardable } from "../config/contribution-tag-definitions.ts";
import { prisma } from "./prisma.ts";
import { recordActivity } from "./activity.ts";
import { createNotification } from "./notifications.ts";
import { NEGATIVE_WORDS, POSITIVE_WORDS } from "./review-quality.ts";

export type FounderContributionTag = {
  type: string;
  label: string;
  icon: string;
  description?: string | null;
};

export const listAwardableTagTypes = listAwardable;

export async function computeAndAwardTags(userId: string): Promise<string[]> {
  const newlyAwarded: string[] = [];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      bio: true,
      startupUrl: true,
      startupName: true,
      cohortId: true,
      profileSlug: true,
    },
  });

  if (!user) return [];

  const reviews = await prisma.review.findMany({
    where: { userId },
    select: { comment: true },
  });

  const existing = await prisma.contributionTag.findMany({
    where: { userId },
    select: { type: true },
  });
  const existingTypes = new Set(existing.map((t) => t.type));

  const profileFieldsFilled = [
    Boolean(user.name),
    Boolean(user.bio),
    Boolean(user.startupUrl),
    Boolean(user.startupName),
    Boolean(user.profileSlug),
  ].filter(Boolean).length;

  const reviewCount = reviews.length;
  const comments = reviews.map((r) => r.comment ?? "").filter((c) => c.length > 0);

  const acceptedReferrals = await prisma.invite.count({
    where: { invitedById: userId, acceptedAt: { not: null } },
  });

  const checks: Array<{ type: string; eligible: boolean; description?: string }> = [
    {
      type: "verified",
      eligible: !!user.cohortId,
      description: "Founder belongs to an incubator cohort.",
    },
    {
      type: "profile_complete",
      eligible: profileFieldsFilled >= 4,
      description: "Founder has filled out most public profile fields.",
    },
    {
      type: "reviewer",
      eligible: reviewCount >= 1,
      description: "Submitted at least 1 review on the platform.",
    },
    {
      type: "top_contributor",
      eligible: reviewCount >= 5,
      description: "Contributed 5 or more reviews to the directory.",
    },
    {
      type: "quality_reviewer",
      eligible: reviewCount >= 10 &&
        comments.length > 0 &&
        comments.reduce((sum, c) => sum + c.split(/\s+/).filter(Boolean).length, 0) / comments.length >= 50,
      description: "10+ reviews with average word count above 50 across all reviews.",
    },
    {
      type: "detailed_reviewer",
      eligible: reviewCount >= 5 &&
        comments.filter((c) => /\d/.test(c)).length >= 5,
      description: "5+ reviews that contain numbers (dates, dollar amounts, timeframes).",
    },
    {
      type: "balanced_reviewer",
      eligible: (() => {
        if (reviewCount < 5) return false;
        const withBoth = comments.filter((c) => {
          const words = c.toLowerCase().match(/\b[a-z]+\b/g) || [];
          const hasPos = words.some((w) => POSITIVE_WORDS.has(w));
          const hasNeg = words.some((w) => NEGATIVE_WORDS.has(w));
          return hasPos && hasNeg;
        });
        return withBoth.length >= 5;
      })(),
      description: "5+ reviews containing both positive and negative sentiment.",
    },
    {
      type: "trusted_reviewer",
      eligible: (() => {
        if (reviewCount === 0) return false;
        const recent = reviews.slice(-20);
        return !recent.some((r) => {
          const text = r.comment ?? "";
          if (text.length < 20) return true;
          const words = text.split(/\s+/);
          const hasUpper = words.some((w) => w.length >= 3 && w === w.toUpperCase() && /[A-Z]/.test(w));
          return /[!?]{3,}/.test(text) || hasUpper;
        });
      })(),
      description: "No spam or quality warnings triggered in last 20 reviews.",
    },
    {
      type: "recruiter",
      eligible: acceptedReferrals >= 3,
      description: "Invited 3+ founders who joined the cohort.",
    },
  ];

  for (const check of checks) {
    if (!check.eligible) continue;
    if (existingTypes.has(check.type)) continue;

    await prisma.contributionTag.create({
      data: {
        userId,
        type: check.type,
        description: check.description,
        issuerType: "auto",
      },
    });

    const def = contributionTagDefinition(check.type);
    const tagLabel = def?.label ?? check.type;

    createNotification({
      userId,
      type: "tag_earned",
      title: `You earned the ${tagLabel} contribution tag`,
      body: check.description,
      link: "/contribution-tags",
    }).catch(() => {});

    if (user.cohortId) {
      recordActivity({
        userId,
        cohortId: user.cohortId,
        type: "tag_earned",
        metadata: { tagType: check.type },
      }).catch(() => {});
    }

    newlyAwarded.push(check.type);
  }

  return newlyAwarded;
}

async function computeAutoTags(userId: string): Promise<FounderContributionTag[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      bio: true,
      startupUrl: true,
      startupName: true,
      cohortId: true,
      profileSlug: true,
    },
  });

  if (!user) return [];

  const tags: FounderContributionTag[] = [];

  const verifiedDef = contributionTagDefinition("verified");
  if (verifiedDef && user.cohortId) {
    tags.push({ type: verifiedDef.type, label: verifiedDef.label, icon: verifiedDef.icon });
  }

  const profileFields = [
    Boolean(user.name),
    Boolean(user.bio),
    Boolean(user.startupUrl),
    Boolean(user.startupName),
    Boolean(user.profileSlug),
  ];
  const filledFields = profileFields.filter(Boolean).length;
  const profileDef = contributionTagDefinition("profile_complete");
  if (profileDef && filledFields >= 4) {
    tags.push({ type: profileDef.type, label: profileDef.label, icon: profileDef.icon });
  }

  const reviewCount = await prisma.review.count({ where: { userId } });
  const reviewerDef = contributionTagDefinition("reviewer");
  if (reviewerDef && reviewCount >= 1) {
    tags.push({ type: reviewerDef.type, label: reviewerDef.label, icon: reviewerDef.icon });
  }

  const topContributorDef = contributionTagDefinition("top_contributor");
  if (topContributorDef && reviewCount >= 5) {
    tags.push({ type: topContributorDef.type, label: topContributorDef.label, icon: topContributorDef.icon });
  }

  const acceptedReferrals = await prisma.invite.count({
    where: { invitedById: userId, acceptedAt: { not: null } },
  });
  const recruiterDef = contributionTagDefinition("recruiter");
  if (recruiterDef && acceptedReferrals >= 3) {
    tags.push({ type: recruiterDef.type, label: recruiterDef.label, icon: recruiterDef.icon });
  }

  const qualityDefs = await computeQualityTags(userId, reviewCount);
  tags.push(...qualityDefs);

  return tags;
}

async function computeQualityTags(userId: string, reviewCount: number): Promise<FounderContributionTag[]> {
  const result: FounderContributionTag[] = [];
  if (reviewCount === 0) return result;

  const reviews = await prisma.review.findMany({
    where: { userId },
    select: { comment: true },
  });

  const comments = reviews.map((r) => r.comment ?? "").filter((c) => c.length > 0);

  const qualityDef = contributionTagDefinition("quality_reviewer");
  if (qualityDef && reviewCount >= 10) {
    const avgWords = comments.reduce((sum, c) => sum + c.split(/\s+/).filter(Boolean).length, 0) / comments.length;
    if (avgWords >= 50) {
      result.push({ type: qualityDef.type, label: qualityDef.label, icon: qualityDef.icon });
    }
  }

  const detailedDef = contributionTagDefinition("detailed_reviewer");
  if (detailedDef && reviewCount >= 5) {
    const withNumbers = comments.filter((c) => /\d/.test(c)).length;
    if (withNumbers >= 5) {
      result.push({ type: detailedDef.type, label: detailedDef.label, icon: detailedDef.icon });
    }
  }

  const balancedDef = contributionTagDefinition("balanced_reviewer");
  if (balancedDef && reviewCount >= 5) {
    const withBothSentiments = comments.filter((c) => {
      const words = c.toLowerCase().match(/\b[a-z]+\b/g) || [];
      const hasPos = words.some((w) => POSITIVE_WORDS.has(w));
      const hasNeg = words.some((w) => NEGATIVE_WORDS.has(w));
      return hasPos && hasNeg;
    }).length;
    if (withBothSentiments >= 5) {
      result.push({ type: balancedDef.type, label: balancedDef.label, icon: balancedDef.icon });
    }
  }

  const trustedDef = contributionTagDefinition("trusted_reviewer");
  if (trustedDef) {
    const recentReviews = await prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { comment: true, id: true },
    });
    const hasQualityIssues = recentReviews.some((r) => {
      const text = r.comment ?? "";
      if (text.length < 20) return true;
      const words = text.split(/\s+/);
      const hasUpper = words.some((w) => w.length >= 3 && w === w.toUpperCase() && /[A-Z]/.test(w));
      if (/[!?]{3,}/.test(text) || hasUpper) return true;
      return false;
    });
    if (!hasQualityIssues && recentReviews.length >= 1) {
      result.push({ type: trustedDef.type, label: trustedDef.label, icon: trustedDef.icon });
    }
  }

  return result;
}

async function getStoredTags(userId: string): Promise<FounderContributionTag[]> {
  const stored = await prisma.contributionTag.findMany({
    where: { userId },
    orderBy: { earnedAt: "desc" },
  });

  return stored.map((t) => {
    const def = contributionTagDefinition(t.type);
    return {
      type: t.type,
      label: def?.label ?? t.type,
      icon: def?.icon ?? "\uD83C\uDFC6",
      description: t.description,
    };
  });
}

export async function getFounderTagsByEmail(email: string): Promise<FounderContributionTag[]> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) return [];

  const [auto, stored] = await Promise.all([
    computeAutoTags(user.id),
    getStoredTags(user.id),
  ]);

  const seenTypes = new Set(auto.map((t) => t.type));
  const merged = [...auto];

  for (const tag of stored) {
    if (!seenTypes.has(tag.type)) {
      merged.push(tag);
      seenTypes.add(tag.type);
    }
  }

  return merged;
}

export async function getFounderTags(email: string): Promise<FounderContributionTag[]> {
  return getFounderTagsByEmail(email);
}

export async function awardTag(
  userId: string,
  type: string,
  description?: string,
  issuerType?: string,
  issuerId?: string,
) {
  const def = contributionTagDefinition(type);
  const normalizedIssuerType = issuerType ?? "admin";

  if (!def) {
    throw new Error(`Unknown tag type: ${type}`);
  }

  if (normalizedIssuerType === "admin" && !def.awardableByAdmin) {
    throw new Error(`Tag type "${type}" cannot be awarded by admins.`);
  }

  if (normalizedIssuerType === "vendor" && !def.awardableByVendor) {
    throw new Error(`Tag type "${type}" cannot be awarded by vendors.`);
  }

  if (normalizedIssuerType === "investor" && !def.awardableByInvestor) {
    throw new Error(`Tag type "${type}" cannot be awarded by investors.`);
  }

  if (!["admin", "vendor", "investor"].includes(normalizedIssuerType)) {
    throw new Error(`Unknown tag issuer type: ${normalizedIssuerType}`);
  }

  if (normalizedIssuerType !== "admin" && !issuerId) {
    throw new Error("External tag awards require an issuer id.");
  }

  const existing = await prisma.contributionTag.findFirst({
    where: { userId, type },
  });

  if (existing) {
    throw new Error("This founder already has this contribution tag.");
  }

  const tag = await prisma.contributionTag.create({
    data: { userId, type, description, issuerType: normalizedIssuerType, issuerId },
  });

  const tagLabel = def?.label ?? type;

  createNotification({
    userId,
    type: "tag_earned",
    title: `You earned the ${tagLabel} contribution tag`,
    body: description ?? undefined,
    link: "/contribution-tags",
  }).catch(() => {});

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cohortId: true },
  });
  if (user?.cohortId) {
    recordActivity({
      userId,
      cohortId: user.cohortId,
      type: "tag_earned",
      metadata: { tagType: type },
    }).catch(() => {});
  }

  return tag;
}

export async function getTagsForFounder(userId: string) {
  const tags = await prisma.contributionTag.findMany({
    where: { userId },
    orderBy: { earnedAt: "desc" },
    select: { type: true, description: true, issuerType: true, issuerId: true, earnedAt: true },
  });

  return tags.map((t) => {
    const def = contributionTagDefinition(t.type);
    return { ...t, label: def?.label ?? t.type, icon: def?.icon ?? "\uD83C\uDFC6" };
  });
}
