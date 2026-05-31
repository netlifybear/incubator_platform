import type { BacklinkLog } from "@prisma/client";

export type BacklinkAnalysisResult = {
  totalLinks: number;
  anchorTextScore: number;
  contextScore: number;
  velocityScore: number;
  naturalLinkScore: number;
  anchorTextBreakdown: {
    branded: number;
    generic: number;
    exactMatch: number;
    brandedPct: number;
    genericPct: number;
    exactMatchPct: number;
  };
  velocity: {
    linksPerDay: number;
    baselinePerDay: number;
    penaltyThreshold: number;
  };
  warnings: BacklinkWarning[];
  policyViolations: PolicyViolation[];
};

export type BacklinkWarning = {
  type: "anchor_text" | "velocity" | "natural_score";
  severity: "warning" | "error";
  message: string;
  justification: string;
  actionableAdvice: string;
};

export type PolicyViolation = {
  policy: string;
  engine: string;
  policyUrl: string;
  rule: string;
  severity: "warning" | "error";
  message: string;
  linkProperty: string;
  currentValue: string;
  thresholdNote: string;
};

const PENALTY_THRESHOLD = 1.0;
const BASELINE_LINKS_PER_DAY = 0.14;
const EXACT_MATCH_THRESHOLD = 0.2;
const NATURAL_SCORE_WARNING = 0.7;
const NATURAL_SCORE_ERROR = 0.4;

const SPAM_POLICIES = [
  {
    engine: "Google",
    policyUrl: "https://developers.google.com/search/docs/essentials/spam-policies",
    rules: [
      {
        id: "link_spam",
        label: "Link spam",
        description: "Google's spam policy prohibits links intended to manipulate PageRank or rankings.",
        violations: [
          {
            property: "exactMatchPct",
            threshold: 0.2,
            severity: "warning" as const,
            message: "Exact-match anchor text ratio suggests link spam patterns",
            thresholdNote: "Google advises that over 20% exact-match anchors may trigger manual review",
          },
          {
            property: "naturalLinkScore",
            threshold: 0.4,
            severity: "error" as const,
            message: "Natural link score indicates potential link scheme",
            thresholdNote: "Google's spam policies prohibit participation in link schemes of any kind",
          },
        ],
      },
      {
        id: "unnatural_links",
        label: "Unnatural outbound links",
        description: "Buying or selling links passes PageRank, which violates Google's guidelines.",
        violations: [
          {
            property: "velocityScore",
            threshold: 0.3,
            severity: "warning" as const,
            message: "Link velocity suggests unnatural acquisition patterns",
            thresholdNote: "Google may algorithmically devalue links acquired in rapid bursts",
          },
        ],
      },
    ],
  },
  {
    engine: "Microsoft (Bing)",
    policyUrl: "https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a",
    rules: [
      {
        id: "link_quality",
        label: "Link quality guidelines",
        description: "Bing Webmaster Guidelines prohibit artificially inflating link popularity.",
        violations: [
          {
            property: "naturalLinkScore",
            threshold: 0.5,
            severity: "warning" as const,
            message: "Link profile quality below Bing's recommended threshold",
            thresholdNote: "Bing recommends maintaining a natural link profile with diverse anchor text",
          },
        ],
      },
    ],
  },
];

function evaluatePolicyViolations(
  result: Omit<BacklinkAnalysisResult, "policyViolations">,
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];

  for (const policy of SPAM_POLICIES) {
    for (const rule of policy.rules) {
      for (const v of rule.violations) {
        let currentValue: number | undefined;
        if (v.property === "exactMatchPct" && result.anchorTextBreakdown) {
          currentValue = result.anchorTextBreakdown.exactMatchPct / 100;
        } else if (v.property === "naturalLinkScore") {
          currentValue = result.naturalLinkScore;
        } else if (v.property === "velocityScore") {
          currentValue = result.velocityScore;
        }

        if (currentValue !== undefined && currentValue < v.threshold) {
          violations.push({
            policy: rule.label,
            engine: policy.engine,
            policyUrl: policy.policyUrl,
            rule: rule.id,
            severity: v.severity,
            message: v.message,
            linkProperty: v.property,
            currentValue: `${Math.round(currentValue * 100)}%`,
            thresholdNote: v.thresholdNote,
          });
        }
      }
    }
  }

  return violations;
}

export function analyzeBacklinks(
  backlinks: Pick<BacklinkLog, "anchorText" | "linkedAt" | "discoveredAt">[],
  windowDays = 90,
): BacklinkAnalysisResult {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowDays * 86400000);
  const windowLinks = backlinks.filter((b) => {
    const date: Date = b.linkedAt ?? b.discoveredAt;
    return date >= windowStart;
  });

  const totalLinks = windowLinks.length;
  const withAnchorText = windowLinks.filter((b) => b.anchorText);

  const branded: string[] = [];
  const generic: string[] = [];
  const exactMatch: string[] = [];

  for (const link of withAnchorText) {
    const text = link.anchorText!.toLowerCase().trim();
    if (!text) {
      generic.push(link.anchorText!);
      continue;
    }
    if (text.length <= 4 || /^(click here|read more|learn more|this site|visit|here|link)$/.test(text)) {
      generic.push(link.anchorText!);
    } else if (/^(the |a |an )?[a-z]+\s+(services?|solutions?|company|business|firm|agency|consulting|group|partners?)/.test(text)) {
      exactMatch.push(link.anchorText!);
    } else {
      branded.push(link.anchorText!);
    }
  }

  const total = withAnchorText.length || 1;
  const brandedPct = branded.length / total;
  const genericPct = generic.length / total;
  const exactMatchPct = exactMatch.length / total;

  const anchorTextScore = (brandedPct + genericPct * 0.5);

  const contextScore = total > 0 ? 0.6 + (exactMatchPct > 0.3 ? -0.3 : 0) + (genericPct > 0.5 ? 0.2 : 0) : 0;
  const clampedContextScore = Math.max(0, Math.min(1, contextScore));

  let velocityScore = 0;
  if (totalLinks > 0) {
    const daysElapsed = Math.max(1, Math.round((now.getTime() - windowStart.getTime()) / 86400000));
    const linksPerDay = totalLinks / daysElapsed;
    const baseline = BASELINE_LINKS_PER_DAY;
    const penalty = PENALTY_THRESHOLD;
    velocityScore = 1 - Math.min(1, Math.max(0, linksPerDay - baseline) / penalty);
  } else {
    velocityScore = 1;
  }

  const naturalLinkScore = anchorTextScore * 0.4 + clampedContextScore * 0.3 + velocityScore * 0.3;

  const warnings: BacklinkWarning[] = [];

  if (exactMatchPct > EXACT_MATCH_THRESHOLD) {
    const pct = Math.round(exactMatchPct * 100);
    warnings.push({
      type: "anchor_text",
      severity: "warning",
      message: `Exact-match anchor text (${pct}%) exceeds the 20% threshold`,
      justification: `Search engines view a high proportion of exact-match anchors as manipulative. Yours is ${pct}%.`,
      actionableAdvice: `Mix in branded anchors (e.g., "Incubator Trust") and generic phrases ("click here", "learn more") to bring exact-match below 20%.`,
    });
  }

  if (naturalLinkScore < NATURAL_SCORE_ERROR) {
    const pct = Math.round(naturalLinkScore * 100);
    warnings.push({
      type: "natural_score",
      severity: "error",
      message: `Natural link score is ${pct}% — flagged for review`,
      justification: `A score below 40% indicates patterns that may violate search engine guidelines.`,
      actionableAdvice: `Review your linked domains. Ensure each link adds genuine value. Remove or update low-quality referring links.`,
    });
  } else if (naturalLinkScore < NATURAL_SCORE_WARNING) {
    const pct = Math.round(naturalLinkScore * 100);
    warnings.push({
      type: "natural_score",
      severity: "warning",
      message: `Natural link score of ${pct}% needs attention`,
      justification: `Below 70% suggests your link profile could be more natural. Diversify anchor text and sources.`,
      actionableAdvice: `Aim for a mix of branded, generic, and exact-match anchors. Spread new links over time.`,
    });
  }

  if (velocityScore < 0.5) {
    const linksPerDay = totalLinks / Math.max(1, Math.round((now.getTime() - windowStart.getTime()) / 86400000));
    warnings.push({
      type: "velocity",
      severity: "warning",
      message: `Link velocity is high (${linksPerDay.toFixed(2)} links/day)`,
      justification: `A sudden spike in new links can trigger search engine spam detectors.`,
      actionableAdvice: `Space out new link acquisitions. Natural profiles grow gradually, not in bursts.`,
    });
  }

  const linksPerDay = totalLinks / Math.max(1, Math.round((now.getTime() - windowStart.getTime()) / 86400000));

  const baseResult = {
    totalLinks,
    anchorTextScore: Math.round(anchorTextScore * 100) / 100,
    contextScore: Math.round(clampedContextScore * 100) / 100,
    velocityScore: Math.round(velocityScore * 100) / 100,
    naturalLinkScore: Math.round(naturalLinkScore * 100) / 100,
    anchorTextBreakdown: {
      branded: branded.length,
      generic: generic.length,
      exactMatch: exactMatch.length,
      brandedPct: Math.round(brandedPct * 100),
      genericPct: Math.round(genericPct * 100),
      exactMatchPct: Math.round(exactMatchPct * 100),
    },
    velocity: {
      linksPerDay: Math.round(linksPerDay * 100) / 100,
      baselinePerDay: BASELINE_LINKS_PER_DAY,
      penaltyThreshold: PENALTY_THRESHOLD,
    },
    warnings,
  };

  const policyViolations = evaluatePolicyViolations(baseResult);

  return {
    ...baseResult,
    policyViolations,
  };
}
