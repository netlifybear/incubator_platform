export const TIERS = [
  { threshold: 0, title: "New Contributor", description: "Start contributing to unlock your first milestone." },
  { threshold: 25, title: "Bronze Contributor", description: "Earn the ability to set a custom profile slug." },
  { threshold: 50, title: "Silver Contributor", description: "Your profile gets a featured highlight on the leaderboard." },
  { threshold: 100, title: "Gold Contributor", description: "Unlock share buttons on your public profile." },
  { threshold: 200, title: "Platinum Contributor", description: "Earn an exclusive early-access contribution tag." },
] as const;

export type TierProgress = {
  current: typeof TIERS[number];
  next: typeof TIERS[number] | null;
  progress: number;
};

export function computeTierProgress(points: number): TierProgress | null {
  const idx = TIERS.findIndex((t, i) => {
    const next = TIERS[i + 1];
    return next ? points >= t.threshold && points < next.threshold : points >= t.threshold;
  });
  if (idx === -1) return null;
  const current = TIERS[idx];
  const next = TIERS[idx + 1] ?? null;
  if (!next) return { current, next: null, progress: 1 };
  const range = next.threshold - current.threshold;
  const progress = Math.min((points - current.threshold) / range, 1);
  return { current, next, progress };
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function computeReviewStreak(lastReviewDate: Date | null): number {
  if (!lastReviewDate) return 0;

  const now = Date.now();
  const diff = now - lastReviewDate.getTime();
  return diff <= MS_PER_WEEK ? 1 : 0;
}
