export const PUBLIC_LEADERBOARD_MIN_FOUNDERS = 5;

export function shouldShowPublicLeaderboard(entryCount: number) {
  return entryCount >= PUBLIC_LEADERBOARD_MIN_FOUNDERS;
}
