export function formatAverageRating(averageRating: number | null) {
  return averageRating === null ? "New" : averageRating.toFixed(1);
}

export function reviewCountLabel(reviewCount: number) {
  return `${reviewCount} named review${reviewCount === 1 ? "" : "s"}`;
}
