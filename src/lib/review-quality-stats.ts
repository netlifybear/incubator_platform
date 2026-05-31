import { prisma } from "@/lib/prisma";
import { POSITIVE_WORDS, NEGATIVE_WORDS } from "@/lib/review-quality";

export type ReviewQualityStats = {
  totalReviews: number;
  averageLength: number;
  averageWordCount: number;
  averageRating: number;
  withNumbers: number;
  withBothSentiments: number;
  withServiceMention: number;
  withOutcome: number;
  withExcessivePunctuation: number;
  totalHelpfulVotes: number;
  spamFlagCount: number;
  strengths: string[];
  improvements: string[];
};

export async function getFounderReviewQuality(userId: string): Promise<ReviewQualityStats> {
  const reviews = await prisma.review.findMany({
    where: { userId },
    select: { comment: true, rating: true, id: true },
    orderBy: { createdAt: "desc" },
  });

  const comments = reviews.map((r) => r.comment ?? "").filter((c) => c.length > 0);
  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return {
      totalReviews: 0,
      averageLength: 0,
      averageWordCount: 0,
      averageRating: 0,
      withNumbers: 0,
      withBothSentiments: 0,
      withServiceMention: 0,
      withOutcome: 0,
      withExcessivePunctuation: 0,
      totalHelpfulVotes: 0,
      spamFlagCount: 0,
      strengths: ["No reviews yet. Write your first review to get started."],
      improvements: ["Write your first review to see quality metrics."],
    };
  }

  const totalLength = comments.reduce((sum, c) => sum + c.length, 0);
  const totalWords = comments.reduce((sum, c) => sum + c.split(/\s+/).filter(Boolean).length, 0);
  const averageLength = Math.round(totalLength / comments.length);
  const averageWordCount = Math.round(totalWords / comments.length);
  const averageRating = Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10;

  const withNumbers = comments.filter((c) => /\d/.test(c)).length;
  const withExcessivePunctuation = comments.filter((c) => {
    const words = c.split(/\s+/);
    const hasUpper = words.some((w) => w.length >= 3 && w === w.toUpperCase() && /[A-Z]/.test(w));
    return /[!?]{3,}/.test(c) || hasUpper;
  }).length;

  const withBothSentiments = comments.filter((c) => {
    const words = c.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const hasPos = words.some((w) => POSITIVE_WORDS.has(w));
    const hasNeg = words.some((w) => NEGATIVE_WORDS.has(w));
    return hasPos && hasNeg;
  }).length;

  const withServiceMention = comments.filter((c) => {
    const lower = c.toLowerCase();
    return /service|used|hired|worked with|helped|provided|delivered/i.test(lower);
  }).length;

  const withOutcome = comments.filter((c) => {
    const lower = c.toLowerCase();
    return /result|outcome|saved|earned|increased|improved|completed|achieved|because|led to/i.test(lower);
  }).length;

  const helpfulVotes = await prisma.helpfulVote.count({
    where: { reviewId: { in: reviews.map((r) => r.id) }, value: true },
  });

  const spamFlagCount = withExcessivePunctuation;

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (averageWordCount >= 50) strengths.push("Reviews are consistently detailed (avg 50+ words)");
  else if (averageWordCount >= 30) strengths.push("Reviews have good detail (avg 30+ words)");
  else improvements.push("Aim for longer reviews (target 50+ words average)");

  const withNumbersPct = Math.round((withNumbers / comments.length) * 100);
  if (withNumbersPct >= 60) strengths.push(`High use of specific details (${withNumbersPct}% of reviews contain numbers)`);
  else improvements.push("Add dates, amounts, or timeframes to increase credibility");

  const sentimentsPct = Math.round((withBothSentiments / comments.length) * 100);
  if (sentimentsPct >= 50) strengths.push("Balanced reviews with both positive and constructive feedback");
  else improvements.push("Include constructive criticism alongside positive feedback for balanced reviews");

  const servicePct = Math.round((withServiceMention / comments.length) * 100);
  if (servicePct >= 70) strengths.push("Clearly describes services used");
  else improvements.push("Mention the specific service or product you used");

  const outcomePct = Math.round((withOutcome / comments.length) * 100);
  if (outcomePct >= 50) strengths.push("Reviews describe specific outcomes and results");
  else improvements.push("Share what actually happened — outcomes add real value");

  if (helpfulVotes > 0) strengths.push(`Received ${helpfulVotes} helpful vote${helpfulVotes === 1 ? "" : "s"} from peers`);
  if (spamFlagCount === 0) strengths.push("No quality flags detected");
  else improvements.push(`Fix ${spamFlagCount} review${spamFlagCount === 1 ? "" : "s"} with excessive punctuation or ALL CAPS`);

  if (averageRating >= 4) strengths.push("Generally rates vendors highly (avg " + averageRating + "/5)");

  return {
    totalReviews,
    averageLength,
    averageWordCount,
    averageRating,
    withNumbers,
    withBothSentiments,
    withServiceMention,
    withOutcome,
    withExcessivePunctuation,
    totalHelpfulVotes: helpfulVotes,
    spamFlagCount,
    strengths: strengths.slice(0, 5),
    improvements: improvements.slice(0, 3),
  };
}
