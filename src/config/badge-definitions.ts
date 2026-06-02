export type BadgeDefinition = {
  type: string;
  label: string;
  icon: string;
  description: string;
  criteria: string;
  awardableByAdmin: boolean;
  awardableByVendor?: boolean;
  awardableByInvestor?: boolean;
  computable?: boolean;
  nominatable?: boolean;
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    type: "verified",
    label: "Verified",
    icon: "\u2705",
    description: "Founder belongs to an incubator cohort.",
    criteria: "Automatically granted when a founder accepts a cohort invite.",
    awardableByAdmin: false,
    computable: true,
  },
  {
    type: "profile_complete",
    label: "Profile Complete",
    icon: "\uD83C\uDF1F",
    description: "Founder has filled out most public profile fields.",
    criteria: "4 of 5 profile fields completed: name, bio, startup name, startup URL, profile slug.",
    awardableByAdmin: false,
    computable: true,
  },
  {
    type: "reviewer",
    label: "Founding Reviewer",
    icon: "\uD83D\uDCDD",
    description: "Founder has written at least one vendor review.",
    criteria: "Submitted at least 1 review on the platform.",
    awardableByAdmin: false,
    computable: true,
  },
  {
    type: "community_contributor",
    label: "Community Contributor",
    icon: "\uD83E\uDD1D",
    description: "Awarded by incubator admin for meaningful cohort contributions.",
    criteria: "Nominated by a peer and approved by admin, or directly awarded by admin for meaningful contributions like helping other founders, sharing resources, or participating in cohort discussions.",
    awardableByAdmin: true,
    nominatable: true,
  },
  {
    type: "helpful_reviewer",
    label: "Helpful Reviewer",
    icon: "\uD83D\uDC4D",
    description: "Awarded by incubator admin for exceptionally helpful reviews.",
    criteria: "Nominated by a peer and approved by admin, or directly awarded by admin for writing reviews that are notably detailed, insightful, or useful to the cohort.",
    awardableByAdmin: true,
    nominatable: true,
  },
  {
    type: "vendor_endorsed",
    label: "Vendor Endorsed",
    icon: "\uD83C\uDF1F",
    description: "Awarded directly by a vendor for outstanding founder engagement or partnership.",
    criteria: "Awarded by a vendor using their unique badge award secret. Recognizes founders who have worked closely with the vendor and demonstrated strong collaboration.",
    awardableByVendor: true,
    awardableByAdmin: true,
  },
  {
    type: "investor_backed",
    label: "Investor Backed",
    icon: "\uD83D\uDCB0",
    description: "Recognized by an investor for strong traction, team quality, or market fit.",
    criteria: "Awarded by an accredited investor using their unique badge award secret. Signals that a founder has caught investor attention.",
    awardableByInvestor: true,
    awardableByAdmin: true,
  },
  {
    type: "quality_reviewer",
    label: "Quality Reviewer",
    icon: "\uD83C\uDFAF",
    description: "Consistently writes high-quality reviews averaging over 50 words.",
    criteria: "10+ reviews with average word count above 50 across all reviews.",
    awardableByAdmin: false,
    computable: true,
  },
  {
    type: "detailed_reviewer",
    label: "Detailed Reviewer",
    icon: "\uD83D\uDD0D",
    description: "Reviews contain specific details like dates, amounts, or numbers.",
    criteria: "5+ reviews that contain numbers (dates, dollar amounts, timeframes).",
    awardableByAdmin: false,
    computable: true,
  },
  {
    type: "balanced_reviewer",
    label: "Balanced Reviewer",
    icon: "\u2696\uFE0F",
    description: "Provides both positive feedback and constructive criticism.",
    criteria: "5+ reviews containing both positive and negative sentiment.",
    awardableByAdmin: false,
    computable: true,
  },
  {
    type: "trusted_reviewer",
    label: "Trusted Reviewer",
    icon: "\uD83D\uDD12",
    description: "No quality flags detected across recent reviews.",
    criteria: "No spam or quality warnings triggered in last 20 reviews. Demonstrates consistently helpful, authentic contributions.",
    awardableByAdmin: false,
    computable: true,
  },
  {
    type: "helpful",
    label: "Helpful",
    icon: "\uD83D\uDC4D",
    description: "Review marked helpful by peers.",
    criteria: "Awarded when a review receives helpful votes from other founders.",
    awardableByAdmin: true,
    nominatable: true,
  },
  {
    type: "connector",
    label: "Connector",
    icon: "\uD83D\uDD17",
    description: "Initiated a guest post exchange with another founder.",
    criteria: "Completed at least one guest post exchange request.",
    awardableByAdmin: true,
    nominatable: true,
  },
  {
    type: "early_adopter",
    label: "Early Adopter",
    icon: "\uD83D\uDC4B",
    description: "Among the first to write reviews on the platform.",
    criteria: "One of the first founders in a cohort to submit reviews.",
    awardableByAdmin: true,
  },
  {
    type: "top_contributor",
    label: "Top Contributor",
    icon: "\uD83C\uDFC6",
    description: "Contributed 5+ reviews to the directory.",
    criteria: "Awarded to founders who have written 5 or more reviews.",
    awardableByAdmin: true,
    computable: true,
  },
  {
    type: "recruiter",
    label: "Recruiter",
    icon: "\uD83E\uDD1D",
    description: "Invited 3+ founders who joined the cohort.",
    criteria: "3+ accepted referrals through founder invite links.",
    awardableByAdmin: true,
    computable: true,
  },
];

export function badgeDefinition(type: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.type === type);
}

export function badgeDefinitionsAwardableBy(issuerType: string): BadgeDefinition[] {
  switch (issuerType) {
    case "admin":
      return BADGE_DEFINITIONS.filter((b) => b.awardableByAdmin);
    case "vendor":
      return BADGE_DEFINITIONS.filter((b) => b.awardableByVendor);
    case "investor":
      return BADGE_DEFINITIONS.filter((b) => b.awardableByInvestor);
    default:
      return [];
  }
}

export function listAwardableBadgeTypes(issuerType?: string) {
  if (issuerType) return badgeDefinitionsAwardableBy(issuerType);
  return BADGE_DEFINITIONS.filter((b) => b.awardableByAdmin);
}
