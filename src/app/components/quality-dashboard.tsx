import { getFounderReviewQuality } from "@/lib/review-quality-stats";

export async function QualityDashboard({ userId }: { userId: string }) {
  const stats = await getFounderReviewQuality(userId);

  if (stats.totalReviews === 0) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
          Review quality
        </p>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Write your first review to see quality metrics and personalized improvement tips.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
        Review quality
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Across {stats.totalReviews} review{stats.totalReviews === 1 ? "" : "s"}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Avg length" value={`${stats.averageLength} chars`} />
        <MetricCard label="Avg words" value={`${stats.averageWordCount} words`} />
        <MetricCard label="Avg rating" value={`${stats.averageRating}/5`} />
        <MetricCard label="Helpful votes" value={String(stats.totalHelpfulVotes)} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="With numbers" value={percentLabel(stats.withNumbers, stats.totalReviews)} />
        <MetricCard label="Both sentiments" value={percentLabel(stats.withBothSentiments, stats.totalReviews)} />
        <MetricCard label="Service mentioned" value={percentLabel(stats.withServiceMention, stats.totalReviews)} />
        <MetricCard label="Outcome described" value={percentLabel(stats.withOutcome, stats.totalReviews)} />
      </div>

      {stats.strengths.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-green-700">
            Strengths
          </p>
          <ul className="mt-2 space-y-1">
            {stats.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                <span className="mt-0.5 shrink-0">{"\u2713"}</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {stats.improvements.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-700">
            Improvement areas
          </p>
          <ul className="mt-2 space-y-1">
            {stats.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                <span className="mt-0.5 shrink-0">{"\u2191"}</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 text-center">
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function percentLabel(count: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((count / total) * 100)}%`;
}
