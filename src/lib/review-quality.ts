export type QualityWarning = {
  ruleId: string;
  category: string;
  severity: "error" | "warning" | "suggestion" | "info";
  message: string;
  justification: string;
  actionableAdvice: string;
};

export type QualityMetrics = {
  length: number;
  wordCount: number;
  hasNumbers: boolean;
  hasProperNouns: boolean;
  hasServiceMention: boolean;
  hasOutcome: boolean;
  keywordRepetitionDensity: number;
  hasBothSentiments: boolean;
  hasExcessivePunctuation: boolean;
};

export type AnalysisResult = {
  warnings: QualityWarning[];
  metrics: QualityMetrics;
  score: number;
};

export type ChecklistItem = {
  id: string;
  label: string;
  passed: boolean;
  suggestion: string;
};

type RuleConfig = {
  rule_id: string;
  category: string;
  signal: string;
  threshold: number;
  severity: string;
  message_template: string;
  google_justification: string;
  actionable_advice: string;
};

type ModeConfig = {
  mode: string;
  ranking_weights: Record<string, number>;
  rules: RuleConfig[];
};

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "shall", "can", "need",
  "dare", "ought", "used", "it", "its", "my", "your", "his", "her",
  "its", "our", "their", "this", "that", "these", "those", "i", "me",
  "he", "she", "we", "they", "not", "no", "nor", "so", "if", "then",
  "than", "too", "very", "just", "about", "also", "more", "some",
]);

export const POSITIVE_WORDS = new Set([
  "great", "excellent", "amazing", "fantastic", "wonderful", "best",
  "love", "loved", "perfect", "outstanding", "superb", "exceptional",
  "impressive", "pleased", "satisfied", "helpful", "recommend",
  "highly", "brilliant", "awesome", "incredible", "remarkable",
  "terrific", "fabulous", "stellar", "top-notch", "flawless",
  "effective", "efficient", "reliable", "professional", "responsive",
  "fast", "quick", "easy", "smooth", "seamless", "worth",
]);

export const NEGATIVE_WORDS = new Set([
  "bad", "terrible", "awful", "horrible", "worst", "poor",
  "disappointed", "disappointing", "frustrating", "frustrated",
  "slow", "expensive", "rude", "unprofessional", "unreliable",
  "useless", "waste", "avoid", "issue", "problem", "mistake",
  "error", "failed", "failure", "mediocre", "below", "lack",
  "insufficient", "incomplete", "confusing", "difficult", "hard",
  "costly", "overpriced", "unclear", "delayed", "broken",
]);

function getWordFrequency(text: string): Map<string, number> {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const freq = new Map<string, number>();
  for (const word of words) {
    if (word.length < 3 || STOP_WORDS.has(word)) continue;
    freq.set(word, (freq.get(word) || 0) + 1);
  }
  return freq;
}

function calculateRepetitionDensity(text: string): number {
  const freq = getWordFrequency(text);
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 5) return 0;
  let maxDensity = 0;
  for (const count of freq.values()) {
    const density = count / wordCount;
    if (density > maxDensity) maxDensity = density;
  }
  return maxDensity;
}

function checkSentimentBalance(text: string): boolean {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  let positiveCount = 0;
  let negativeCount = 0;
  for (const word of words) {
    if (POSITIVE_WORDS.has(word)) positiveCount++;
    if (NEGATIVE_WORDS.has(word)) negativeCount++;
  }
  return positiveCount > 0 && negativeCount > 0;
}

function hasServiceMention(text: string): boolean {
  const lower = text.toLowerCase();
  const servicePatterns = [
    /service/i, /used/i, /hired/i, /worked with/i, /helped/i,
    /handled/i, /managed/i, /provided/i, /delivered/i, /did/i,
    /filed/i, /prepared/i, /built/i, /designed/i, /developed/i,
    /consult/i, /advised/i, /represented/i, /fixed/i, /solved/i,
    /service/i, /software/i, /platform/i, /tool/i, /product/i,
  ];
  return servicePatterns.some((p) => p.test(lower));
}

function hasOutcome(text: string): boolean {
  const lower = text.toLowerCase();
  const outcomePatterns = [
    /result/i, /outcome/i, /saved/i, /earned/i, /increased/i,
    /decreased/i, /improved/i, /reduced/i, /completed/i, /achieved/i,
    /approved/i, /successful/i, /success/i, /got/i, /ended up/i,
    /turned out/i, /worked out/i, /because/i, /led to/i,
  ];
  return outcomePatterns.some((p) => p.test(lower));
}

function hasExcessivePunctuation(text: string): boolean {
  const words = text.split(/\s+/);
  const hasUpperCaseWord = words.some(
    (w) => w.length >= 3 && w === w.toUpperCase() && /[A-Z]/.test(w),
  );
  return /[!?]{3,}/.test(text) || hasUpperCaseWord;
}

function hasProperNouns(text: string): boolean {
  const words = text.split(/\s+/);
  let properCount = 0;
  for (const word of words) {
    if (/^[A-Z][a-z]/.test(word)) properCount++;
  }
  return properCount >= 2;
}

export function analyzeMetrics(text: string): QualityMetrics {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return {
    length: text.length,
    wordCount: words.length,
    hasNumbers: /\d/.test(text),
    hasProperNouns: hasProperNouns(text),
    hasServiceMention: hasServiceMention(text),
    hasOutcome: hasOutcome(text),
    keywordRepetitionDensity: calculateRepetitionDensity(text),
    hasBothSentiments: checkSentimentBalance(text),
    hasExcessivePunctuation: hasExcessivePunctuation(text),
  };
}

const MAX_POINTS_PER_REVIEW = 10;

export function reviewContributionPoints(comment: string | null | undefined) {
  const text = comment?.trim() ?? "";

  if (!text) {
    return 0;
  }

  const metrics = analyzeMetrics(text);

  if (metrics.length < 50) {
    return 0;
  }

  let points = 0;

  if (metrics.length >= 100) {
    points += 4;
  } else if (metrics.length >= 50) {
    points += 2;
  }

  if (metrics.hasServiceMention) points += 2;
  if (metrics.hasOutcome) points += 2;
  if (metrics.hasNumbers) points += 1;
  if (metrics.hasBothSentiments) points += 1;

  if (/[!?]{3,}/.test(text) || metrics.keywordRepetitionDensity > 0.15) {
    points = Math.max(0, points - 2);
  }

  return Math.min(points, MAX_POINTS_PER_REVIEW);
}

function evaluateSignal(
  signal: string,
  metrics: QualityMetrics,
  disclosed: boolean,
  threshold: number,
): boolean {
  switch (signal) {
    case "min_length":
      return metrics.length >= threshold;
    case "optimal_length":
      return metrics.length >= threshold;
    case "has_service_mention":
      return metrics.hasServiceMention;
    case "has_outcome":
      return metrics.hasOutcome;
    case "has_number":
      return metrics.hasNumbers;
    case "has_both_sentiments":
      return metrics.hasBothSentiments;
    case "keyword_repetition_density":
      return metrics.keywordRepetitionDensity <= threshold;
    case "has_excessive_punctuation":
      return !metrics.hasExcessivePunctuation;
    case "disclosed_incentive":
      return disclosed === true;
    case "has_location":
      return metrics.hasProperNouns;
    case "has_incubator_context":
      return metrics.hasProperNouns;
    case "review_completed":
      return metrics.length > 0;
    default:
      return true;
  }
}

export function analyzeReviewText(
  text: string,
  mode: ModeConfig,
  disclosed: boolean = false,
): AnalysisResult {
  const metrics = analyzeMetrics(text);
  const warnings: QualityWarning[] = [];
  let totalChecks = 0;
  let passedChecks = 0;

  for (const rule of mode.rules) {
    totalChecks++;
    const passes = evaluateSignal(rule.signal, metrics, disclosed, rule.threshold);
    if (passes) {
      passedChecks++;
    } else {
      warnings.push({
        ruleId: rule.rule_id,
        category: rule.category,
        severity: rule.severity as QualityWarning["severity"],
        message: rule.message_template,
        justification: rule.google_justification,
        actionableAdvice: rule.actionable_advice,
      });
    }
  }

  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

  return { warnings, metrics, score };
}

export function generateChecklist(
  text: string,
  disclosed: boolean,
  metrics: QualityMetrics,
): ChecklistItem[] {
  return [
    {
      id: "specific_service",
      label: "Your review describes a specific service or product.",
      passed: metrics.hasServiceMention,
      suggestion: "Mention what specific service you used (e.g., 'tax filing', 'brand design').",
    },
    {
      id: "specific_detail",
      label: "Your review includes a specific detail (date, amount, or timeframe).",
      passed: metrics.hasNumbers,
      suggestion: "Add a date, dollar amount, or timeframe to make your review more credible.",
    },
    {
      id: "balance",
      label: "Your review includes both positive and constructive points.",
      passed: metrics.hasBothSentiments,
      suggestion: "Add one constructive observation alongside your positive feedback.",
    },
    {
      id: "disclosure",
      label: "You have disclosed any discount or free service.",
      passed: disclosed || !metrics.hasNumbers,
      suggestion: "Check the disclosure box if you received a discount or free service.",
    },
    {
      id: "natural_language",
      label: "Your review uses natural language (no ALL CAPS or excessive punctuation).",
      passed: !metrics.hasExcessivePunctuation,
      suggestion: "Remove ALL CAPS or excessive exclamation marks.",
    },
  ];
}

export type { RuleConfig, ModeConfig };
