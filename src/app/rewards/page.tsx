import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { getFounderPoints } from "@/lib/points";
import { computeReviewStreak } from "@/lib/rewards";
import { prisma } from "@/lib/prisma";

const RULES = [
  { action: "Share a useful review", description: "Specific details, outcomes, numbers, and firsthand context make a review easier to trust." },
  { action: "Receive a contribution signal", description: "Contribution tags and nominations add context about the kind of help you have provided." },
  { action: "Help peers decide", description: "Helpful votes show that other founders used your contribution to evaluate a vendor." },
];

export default async function RewardsPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    redirect("/");
  }

  const [points, user] = await Promise.all([
    getFounderPoints(founder.id),
    prisma.user.findUnique({
      where: { id: founder.id },
      select: { lastReviewDate: true },
    }),
  ]);

  const streak = computeReviewStreak(user?.lastReviewDate ?? null);

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Contribution
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Your impact, made visible.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Review quality, contribution signals, and peer recognition help other founders
          understand why your recommendations carry weight.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-8">
          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">How contributions are measured</h2>
            <div className="mt-4 space-y-4">
              {RULES.map((rule) => (
                <div key={rule.action} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
                    <p className="font-semibold">{rule.action}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{rule.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Your impact</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              What your contributions mean for the cohort.
            </p>
            <div className="mt-4 space-y-3">
              {streak > 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <div>
                      <p className="font-semibold">Consistent reviewer</p>
                      <p className="text-sm text-[var(--muted)]">
                        {streak} week streak — your reviews help founders evaluate vendors regularly.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">
                    {points.breakdown.reviews > 0 ? "✓" : "1"}
                  </span>
                  <div>
                    <p className="font-semibold">{points.breakdown.reviews > 0 ? "Vendor evaluations" : "Start reviewing"}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {points.breakdown.reviews > 0
                        ? `Your reviews help ${founder.cohort.name} make informed vendor decisions.`
                        : "Write your first review to help other founders."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">What feeds your credibility</h2>
            <div className="mt-6 space-y-3">
              <BreakdownRow label="Review detail" value={points.breakdown.reviews} />
              <BreakdownRow label="Contribution signals" value={points.breakdown.badges} />
              <BreakdownRow label="Peer validation" value={points.breakdown.helpfulVotes} />
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              Review streak
            </h2>
            <p className="mt-2 text-3xl font-bold">{streak} week{streak === 1 ? "" : "s"}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {streak > 0
                ? "Active — keep it going!"
                : "Write a review this week to start your streak."}
            </p>
          </section>
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
