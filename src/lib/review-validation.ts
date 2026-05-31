export function validateReviewRating(rating: number) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be an integer from 1 to 5.");
  }
}

export function normalizeReviewComment(comment: string) {
  const normalizedComment = comment.trim();

  if (normalizedComment.length < 10) {
    throw new Error("Review comment must be at least 10 characters.");
  }

  return normalizedComment;
}

export function normalizeReviewWorkType(workType: string) {
  const normalizedWorkType = workType.trim();

  return normalizedWorkType || null;
}
