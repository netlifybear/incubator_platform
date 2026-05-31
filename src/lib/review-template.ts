export type ReviewTemplateData = {
  service: string;
  outcome: string;
  positive: string;
  negative: string;
  wouldUseAgain: "yes" | "no" | "maybe" | null;
  disclosedIncentive: boolean;
  incentiveDetail: string;
};

const INITIAL_TEMPLATE: ReviewTemplateData = {
  service: "",
  outcome: "",
  positive: "",
  negative: "",
  wouldUseAgain: null,
  disclosedIncentive: false,
  incentiveDetail: "",
};

export function emptyTemplate(): ReviewTemplateData {
  return { ...INITIAL_TEMPLATE };
}

export function composeFromTemplate(data: ReviewTemplateData): string {
  const parts: string[] = [];

  if (data.service) {
    parts.push(`I used their ${data.service}.`);
  }

  if (data.outcome) {
    parts.push(data.outcome.endsWith(".") ? ` ${data.outcome}` : ` ${data.outcome}.`);
  }

  if (data.positive) {
    parts.push(` Positive: ${data.positive}.`);
  }

  if (data.negative) {
    parts.push(` Negative: ${data.negative}.`);
  }

  if (data.wouldUseAgain) {
    const labels: Record<string, string> = {
      yes: "Yes, I would use this service again.",
      no: "No, I would not use this service again.",
      maybe: "Maybe, depending on the situation.",
    };
    parts.push(` ${labels[data.wouldUseAgain]}`);
  }

  if (data.disclosedIncentive && data.incentiveDetail) {
    parts.push(` Disclosure: ${data.incentiveDetail}.`);
  } else if (data.disclosedIncentive) {
    parts.push(` Disclosure: I received a discount or free service for this honest review.`);
  }

  return parts.join("").trim();
}

export function extractTemplateData(text: string): Partial<ReviewTemplateData> {
  const data: Partial<ReviewTemplateData> = {};

  const serviceMatch = text.match(/I used their (.+?)[.。]/);
  if (serviceMatch) data.service = serviceMatch[1].trim();

  const positiveMatch = text.match(/Positive:\s*(.+?)[.。]/);
  if (positiveMatch) data.positive = positiveMatch[1].trim();

  const negativeMatch = text.match(/Negative:\s*(.+?)[.。]/);
  if (negativeMatch) data.negative = negativeMatch[1].trim();

  if (/would use this service again/i.test(text)) data.wouldUseAgain = "yes";
  if (/would not use this service again/i.test(text)) data.wouldUseAgain = "no";
  if (/maybe/i.test(text) && /depending/i.test(text)) data.wouldUseAgain = "maybe";

  const disclosureMatch = text.match(/Disclosure:\s*(.+?)[.。]/);
  if (disclosureMatch) {
    data.disclosedIncentive = true;
    data.incentiveDetail = disclosureMatch[1].trim();
  }

  return data;
}
