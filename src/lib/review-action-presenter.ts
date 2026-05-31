import { reviewContributionPoints } from "./review-quality.ts";

export function reviewCelebrationPoints(comment: string | null | undefined) {
  return reviewContributionPoints(comment);
}
