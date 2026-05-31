type CelebrationToastProps = {
  pointsEarned: number;
  newTotal: number;
  rank?: { rank: number; total: number } | null;
  badgeType?: string | null;
};

export function CelebrationToast({ pointsEarned, newTotal, rank, badgeType }: CelebrationToastProps) {
  const rankImproved = rank && rank.rank <= 3;
  const badgeEmojis: Record<string, string> = {
    community_contributor: "🤝",
    helpful_reviewer: "👍",
    reviewer: "📝",
    profile_complete: "🌟",
    verified: "✅",
  };

  return (
    <div className="rounded-2xl border border-green-200 bg-green-50/70 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-lg text-white">
          {badgeType ? (badgeEmojis[badgeType] ?? "🏆") : "⭐"}
        </span>
        <div>
          <p className="font-semibold text-green-800">
            {badgeType
              ? `Badge earned! +${pointsEarned} pts`
              : `+${pointsEarned} pts earned`}
          </p>
          <p className="text-sm text-green-700">
            You now have {newTotal} pts.
            {rank && ` Rank: #${rank.rank} of ${rank.total}.`}
            {rankImproved && " Great climb!"}
          </p>
        </div>
      </div>
    </div>
  );
}
