import { badgeDefinition, listAwardableBadgeTypes as listAwardable } from "../config/badge-definitions.ts";
import { prisma } from "./prisma.ts";
import { recordActivity } from "./activity.ts";
import { createNotification } from "./notifications.ts";
import { NEGATIVE_WORDS, POSITIVE_WORDS } from "./review-quality.ts";

export type FounderBadge = {
  type: string;
  label: string;
  icon: string;
  description?: string | null;
};

export const listAwardableBadgeTypes = listAwardable;

async function computeAutoBadges(userId: string): Promise<FounderBadge[]> {
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

  const badges: FounderBadge[] = [];

  const verifiedDef = badgeDefinition("verified");
  if (verifiedDef && user.cohortId) {
    badges.push({ type: verifiedDef.type, label: verifiedDef.label, icon: verifiedDef.icon });
  }

  const profileFields = [
    Boolean(user.name),
    Boolean(user.bio),
    Boolean(user.startupUrl),
    Boolean(user.startupName),
    Boolean(user.profileSlug),
  ];
  const filledFields = profileFields.filter(Boolean).length;
  const profileDef = badgeDefinition("profile_complete");
  if (profileDef && filledFields >= 4) {
    badges.push({ type: profileDef.type, label: profileDef.label, icon: profileDef.icon });
  }

  const reviewCount = await prisma.review.count({ where: { userId } });
  const reviewerDef = badgeDefinition("reviewer");
  if (reviewerDef && reviewCount >= 1) {
    badges.push({ type: reviewerDef.type, label: reviewerDef.label, icon: reviewerDef.icon });
  }

  const qualityDefs = await computeQualityBadges(userId, reviewCount);
  badges.push(...qualityDefs);

  return badges;
}

async function computeQualityBadges(userId: string, reviewCount: number): Promise<FounderBadge[]> {
  const result: FounderBadge[] = [];
  if (reviewCount === 0) return result;

  const reviews = await prisma.review.findMany({
    where: { userId },
    select: { comment: true },
  });

  const comments = reviews.map((r) => r.comment ?? "").filter((c) => c.length > 0);

  const qualityDef = badgeDefinition("quality_reviewer");
  if (qualityDef && reviewCount >= 10) {
    const avgWords = comments.reduce((sum, c) => sum + c.split(/\s+/).filter(Boolean).length, 0) / comments.length;
    if (avgWords >= 50) {
      result.push({ type: qualityDef.type, label: qualityDef.label, icon: qualityDef.icon });
    }
  }

  const detailedDef = badgeDefinition("detailed_reviewer");
  if (detailedDef && reviewCount >= 5) {
    const withNumbers = comments.filter((c) => /\d/.test(c)).length;
    if (withNumbers >= 5) {
      result.push({ type: detailedDef.type, label: detailedDef.label, icon: detailedDef.icon });
    }
  }

  const balancedDef = badgeDefinition("balanced_reviewer");
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

  const trustedDef = badgeDefinition("trusted_reviewer");
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

async function getStoredBadges(userId: string): Promise<FounderBadge[]> {
  const stored = await prisma.badge.findMany({
    where: { userId },
    orderBy: { earnedAt: "desc" },
  });

  return stored.map((b) => {
    const def = badgeDefinition(b.type);
    return {
      type: b.type,
      label: def?.label ?? b.type,
      icon: def?.icon ?? "\uD83C\uDFC6",
      description: b.description,
    };
  });
}

export async function getFounderBadgesByEmail(email: string): Promise<FounderBadge[]> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) return [];

  const [auto, stored] = await Promise.all([
    computeAutoBadges(user.id),
    getStoredBadges(user.id),
  ]);

  const seenTypes = new Set(auto.map((b) => b.type));
  const merged = [...auto];

  for (const badge of stored) {
    if (!seenTypes.has(badge.type)) {
      merged.push(badge);
      seenTypes.add(badge.type);
    }
  }

  return merged;
}

export async function getFounderBadges(email: string): Promise<FounderBadge[]> {
  return getFounderBadgesByEmail(email);
}

export async function awardBadge(
  userId: string,
  type: string,
  description?: string,
  issuerType?: string,
  issuerId?: string,
) {
  const def = badgeDefinition(type);
  const normalizedIssuerType = issuerType ?? "admin";

  if (!def) {
    throw new Error(`Unknown badge type: ${type}`);
  }

  if (normalizedIssuerType === "admin" && !def.awardableByAdmin) {
    throw new Error(`Badge type "${type}" cannot be awarded by admins.`);
  }

  if (normalizedIssuerType === "vendor" && !def.awardableByVendor) {
    throw new Error(`Badge type "${type}" cannot be awarded by vendors.`);
  }

  if (normalizedIssuerType === "investor" && !def.awardableByInvestor) {
    throw new Error(`Badge type "${type}" cannot be awarded by investors.`);
  }

  if (!["admin", "vendor", "investor"].includes(normalizedIssuerType)) {
    throw new Error(`Unknown badge issuer type: ${normalizedIssuerType}`);
  }

  if (normalizedIssuerType !== "admin" && !issuerId) {
    throw new Error("External badge awards require an issuer id.");
  }

  const existing = await prisma.badge.findFirst({
    where: { userId, type },
  });

  if (existing) {
    throw new Error("This founder already has this badge.");
  }

  const badge = await prisma.badge.create({
    data: { userId, type, description, issuerType: normalizedIssuerType, issuerId },
  });

  const badgeLabel = def?.label ?? type;

  createNotification({
    userId,
    type: "badge_earned",
    title: `You earned the ${badgeLabel} badge`,
    body: description ?? undefined,
    link: "/grow",
  }).catch(() => {});

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cohortId: true },
  });
  if (user?.cohortId) {
    recordActivity({
      userId,
      cohortId: user.cohortId,
      type: "badge_earned",
      metadata: { badgeType: type },
    }).catch(() => {});
  }

  return badge;
}

export async function getBadgesForFounder(userId: string) {
  const badges = await prisma.badge.findMany({
    where: { userId },
    orderBy: { earnedAt: "desc" },
    select: { type: true, description: true, issuerType: true, issuerId: true, earnedAt: true },
  });

  return badges.map((b) => {
    const def = badgeDefinition(b.type);
    return { ...b, label: def?.label ?? b.type, icon: def?.icon ?? "\uD83C\uDFC6" };
  });
}
