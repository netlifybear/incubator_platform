import { computeTierProgress } from "@/lib/rewards";

type CelebrationToastProps = {
  pointsEarned: number;
  newTotal: number;
  rank?: { rank: number; total: number } | null;
  badgeType?: string | null;
};

export function CelebrationToast({ pointsEarned, newTotal, rank, badgeType }: CelebrationToastProps) {
  const rankImproved = rank && rank.rank <= 3;
  const progress = computeTierProgress(newTotal);
  const prevProgress = computeTierProgress(newTotal - pointsEarned);
  const prevNext = prevProgress?.next;
  const tierJustUnlocked = prevNext && (!progress?.next || progress.next.threshold !== prevNext.threshold);
  const unlockedTierName = tierJustUnlocked ? prevNext.title : null;
  const badgeEmojis: Record<string, string> = {
    community_contributor: "🤝",
    helpful_reviewer: "👍",
    reviewer: "📝",
    profile_complete: "🌟",
    verified: "✅",
  };

  return (
    <div className="rounded-2xl border border-green-200 bg-green-50/70 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500 text-2xl text-white">
          {badgeType ? (badgeEmojis[badgeType] ?? "🏆") : "⭐"}
        </span>
        <div className="min-w-0 flex-1">
          {unlockedTierName ? (
            <p className="text-lg font-bold text-green-800">
              Contribution milestone reached: {unlockedTierName}
            </p>
          ) : (
            <p className="font-semibold text-green-800">
              {badgeType ? "Contribution tag earned" : "Contribution recorded"}
            </p>
          )}
          <p className="mt-1 text-sm text-green-700">
            Your contribution trail now has {newTotal} internal scoring signals.
            {rank && ` Cohort contribution position: #${rank.rank} of ${rank.total}.`}
            {rankImproved && " Your contributions are highly visible inside the cohort."}
          </p>
          {progress?.next ? (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-green-700">
                  {progress.next.title}
                </span>
                <span className="text-green-600">
                  {newTotal} / {progress.next.threshold} signals
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-green-200">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${Math.round(progress.progress * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-green-600">
                {progress.next.threshold - newTotal} signals to unlock
              </p>
            </div>
          ) : newTotal > 0 ? (
            <p className="mt-2 text-xs font-medium text-green-600">All milestones unlocked!</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
