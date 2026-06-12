import type { CredibilityFactors } from "./credibility-factors.ts";
import type { FounderImpactSummary } from "./impact.ts";

export type CredibilityTierKey =
  | "establishing"
  | "verified"
  | "trusted"
  | "authority"
  | "leader";

export type CredibilityTierInput = {
  reviewCount: number;
  averageReviewQuality: number;
  helpfulVoteCount: number;
  contributionSignalCount: number;
  profileCompletePercentage: number;
  verifiedBacklinkCount: number;
  publicProfileEnabled: boolean;
};

export type CredibilityTier = {
  key: CredibilityTierKey;
  label: string;
  iconText: string;
  description: string;
};

export const CREDIBILITY_TIERS: Record<CredibilityTierKey, CredibilityTier> = {
  establishing: {
    key: "establishing",
    label: "Establishing",
    iconText: "E",
    description: "Building an initial verified contribution track record.",
  },
  verified: {
    key: "verified",
    label: "Verified Contributor",
    iconText: "VC",
    description: "Verified cohort member with early useful contribution evidence.",
  },
  trusted: {
    key: "trusted",
    label: "Trusted Contributor",
    iconText: "TC",
    description: "Quality contributions with peer validation inside the cohort.",
  },
  authority: {
    key: "authority",
    label: "Cohort Authority",
    iconText: "CA",
    description: "Sustained contribution across quality, helpfulness, and external signals.",
  },
  leader: {
    key: "leader",
    label: "Public Credibility Leader",
    iconText: "PL",
    description: "Strong public-safe evidence across reviews, peer validation, and external references.",
  },
};

export function getCredibilityTier(input: CredibilityTierInput): CredibilityTier {
  const reviewQuality = Math.max(0, input.averageReviewQuality);

  if (
    input.publicProfileEnabled &&
    input.reviewCount >= 8 &&
    reviewQuality >= 85 &&
    input.helpfulVoteCount >= 8 &&
    input.contributionSignalCount >= 4 &&
    input.profileCompletePercentage >= 90 &&
    input.verifiedBacklinkCount >= 3
  ) {
    return CREDIBILITY_TIERS.leader;
  }

  if (
    input.reviewCount >= 5 &&
    reviewQuality >= 80 &&
    input.helpfulVoteCount >= 4 &&
    input.contributionSignalCount >= 3 &&
    input.profileCompletePercentage >= 80 &&
    input.verifiedBacklinkCount >= 1
  ) {
    return CREDIBILITY_TIERS.authority;
  }

  if (
    input.reviewCount >= 3 &&
    reviewQuality >= 70 &&
    input.helpfulVoteCount >= 2 &&
    input.contributionSignalCount >= 1 &&
    input.profileCompletePercentage >= 70
  ) {
    return CREDIBILITY_TIERS.trusted;
  }

  if (
    input.reviewCount >= 1 &&
    reviewQuality >= 50 &&
    input.profileCompletePercentage >= 50
  ) {
    return CREDIBILITY_TIERS.verified;
  }

  return CREDIBILITY_TIERS.establishing;
}

export function getReviewQualityPercentage(credibility: CredibilityFactors): number {
  const value = credibility.factors.find((factor) => factor.key === "reviewQuality")?.value;

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace("%", ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function getCredibilityTierFromEvidence(input: {
  credibility: CredibilityFactors;
  impact: FounderImpactSummary;
  profileCompletePercentage: number;
  publicProfileEnabled: boolean;
}): CredibilityTier {
  return getCredibilityTier({
    reviewCount: input.impact.reviewCount,
    averageReviewQuality: getReviewQualityPercentage(input.credibility),
    helpfulVoteCount: input.impact.helpfulVoteCount,
    contributionSignalCount: input.impact.contributionSignalCount,
    profileCompletePercentage: input.profileCompletePercentage,
    verifiedBacklinkCount: input.impact.verifiedBacklinkCount,
    publicProfileEnabled: input.publicProfileEnabled,
  });
}
