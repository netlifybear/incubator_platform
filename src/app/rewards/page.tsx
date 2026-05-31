import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { getFounderPoints, getFounderCohortRank } from "@/lib/points";

const RULES = [
  { action: "Write a useful review", points: "0-10", description: "Earned based on specificity, useful detail, outcomes, numbers, and natural language." },
  { action: "Earn a badge", points: 25, description: "Earned when an admin awards you a badge or your peer nomination is approved." },
  { action: "Receive a helpful vote", points: 2, description: "Earned for each thumbs up your reviews receive from other cohort members." },
];

const TIERS = [
  { threshold: 0, title: "New Contributor", description: "Start contributing to unlock your first milestone." },
  { threshold: 25, title: "Bronze Contributor", description: "Earn the ability to set a custom profile slug." },
  { threshold: 50, title: "Silver Contributor", description: "Your profile gets a featured highlight on the leaderboard." },
  { threshold: 100, title: "Gold Contributor", description: "Unlock share buttons on your public profile." },
  { threshold: 200, title: "Platinum Contributor", description: "Earn an exclusive early-access badge." },
];

function computeProgress(points: number) {
  const idx = TIERS.findIndex((t, i) => {
    const next = TIERS[i + 1];
    return next ? points >= t.threshold && points < next.threshold : points >= t.threshold;
  });
  if (idx === -1) return null;
  const current = TIERS[idx];
  const next = TIERS[idx + 1];
  if (!next) return { current, next: null, progress: 1 };
  const range = next.threshold - current.threshold;
  const progress = Math.min((points - current.threshold) / range, 1);
  return { current, next, progress };
}

export default async function RewardsPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    redirect("/");
  }

  const [points, rank] = await Promise.all([
    getFounderPoints(founder.id),
    getFounderCohortRank(founder.id, founder.cohortId),
  ]);

  const progress = computeProgress(points.total);

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Rewards
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Your contribution, recognized.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Earn points by contributing to the cohort. Each milestone unlocks new capabilities for your portable reputation.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-8">
          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">How to earn points</h2>
            <div className="mt-4 space-y-4">
              {RULES.map((rule) => (
                <div key={rule.action} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{rule.action}</p>
                    <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-sm font-bold text-white">
                      +{rule.points} pts
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{rule.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Milestone unlocks</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Reach point thresholds to unlock reputation features.
            </p>
            <div className="mt-4 space-y-3">
              {TIERS.map((tier, i) => {
                const unlocked = points.total >= tier.threshold;
                const currentTier = progress?.current.threshold === tier.threshold;
                return (
                  <div
                    key={tier.threshold}
                    className={`rounded-2xl border p-4 ${
                      currentTier && progress?.next
                        ? "border-[var(--accent)] bg-[var(--accent)]/5"
                        : unlocked
                          ? "border-green-200 bg-green-50/70"
                          : "border-[var(--border)] bg-[var(--panel)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            unlocked
                              ? "bg-green-500 text-white"
                              : "bg-[var(--panel-strong)] text-[var(--muted)]"
                          }`}
                        >
                          {unlocked ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            String(i + 1)
                          )}
                        </span>
                        <div>
                          <p className={`font-semibold ${unlocked ? "text-green-700" : ""}`}>
                            {tier.title}
                          </p>
                          <p className="text-sm text-[var(--muted)]">{tier.description}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-[var(--muted)]">
                        {tier.threshold} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Your points</h2>
            <div className="mt-6 text-center">
              <p className="text-5xl font-bold text-[var(--accent)]">{points.total}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">total points</p>
            </div>
            {rank && (
              <p className="mt-2 text-center text-sm text-[var(--muted)]">
                #{rank.rank} of {rank.total} in cohort
              </p>
            )}
            <div className="mt-6 space-y-3">
              <BreakdownRow label="From reviews" value={points.breakdown.reviews} />
              <BreakdownRow label="From badges" value={points.breakdown.badges} />
              <BreakdownRow label="From helpful votes" value={points.breakdown.helpfulVotes} />
            </div>
          </section>

          {progress?.next && (
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                Next milestone
              </h2>
              <p className="mt-2 text-lg font-semibold">{progress.next.title}</p>
              <p className="text-sm text-[var(--muted)]">
                {points.total} of {progress.next.threshold} pts
              </p>
              <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[var(--panel-strong)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all"
                  style={{ width: `${Math.round(progress.progress * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-right text-xs text-[var(--muted)]">
                {progress.next.threshold - points.total} pts to unlock
              </p>
            </section>
          )}

          {!progress?.next && points.total > 0 && (
            <section className="rounded-3xl border border-green-200 bg-green-50/70 p-6 shadow-sm">
              <h2 className="font-semibold text-green-700">All milestones unlocked</h2>
              <p className="mt-1 text-sm text-green-600">
                You have reached every tier. Keep contributing to maintain your standing.
              </p>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[var(--panel)] px-4 py-3 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
