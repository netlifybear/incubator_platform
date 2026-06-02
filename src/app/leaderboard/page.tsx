import Link from "next/link";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { getLeaderboard } from "@/lib/leaderboard";
import { getCohortImpactSummary } from "@/lib/impact";

function AccessMessage({
  body,
  ctaHref,
  ctaLabel,
  title,
}: {
  body: string;
  ctaHref: string;
  ctaLabel: string;
  title: string;
}) {
  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-ambient)]">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
        Contribution view
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-normal">{title}</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">{body}</p>
      <Link
        href={ctaHref}
        className="mt-6 inline-flex rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)]"
      >
        {ctaLabel}
      </Link>
    </section>
  );
}

export default async function LeaderboardPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    return (
      <AppShell founder={null} cohortName="Guest">
        <AccessMessage
          title="Sign in to view cohort contributions."
          body="The private contribution view is only available inside a verified cohort workspace, so founder names and contribution activity stay cohort-scoped."
          ctaHref="/signin?callbackUrl=/leaderboard"
          ctaLabel="Sign in"
        />
      </AppShell>
    );
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    return (
      <AppShell founder={founder} cohortName="No cohort assigned">
        <AccessMessage
          title="Join a cohort before viewing contribution patterns."
          body="Contribution signals come from reviews, badges, and helpful votes inside a cohort. Ask your incubator admin for an invite to activate this workspace."
          ctaHref="/"
          ctaLabel="Back to dashboard"
        />
      </AppShell>
    );
  }

  const [impact, entries] = await Promise.all([
    getCohortImpactSummary(founder.cohortId),
    getLeaderboard(founder.cohortId),
  ]);

  const currentUserId = founder.id;
  const metrics = [
    { label: "Founders in cohort", value: impact.founderCount },
    { label: "Active contributors", value: impact.activeContributorCount },
    { label: "Reviews shared", value: impact.reviewCount },
    { label: "Helpful votes", value: impact.helpfulVoteCount },
  ];

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <div className="space-y-6">
        <section className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-ambient)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                Contribution view
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-normal">
                Cohort contributions
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">
                See where reviews, helpful votes, and badges are strengthening the cohort
                knowledge base. Use it to spot participation patterns and celebrate impact.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-ambient)]"
            >
              <p className="text-sm text-[var(--muted)]">{metric.label}</p>
              <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-ambient)]">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="text-2xl font-semibold">Contributor patterns</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Ordering reflects contribution activity, but point totals stay internal.
              </p>
            </div>
            <Link
              href="/rewards"
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--accent)] transition hover:border-[var(--accent)]"
            >
              View contribution
            </Link>
          </div>

          {entries.length === 0 ? (
            <p className="mt-6 text-[var(--muted)]">
              No founders in this cohort yet.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[var(--border)]">
              {entries.map((entry) => {
                const isCurrentUser = entry.userId === currentUserId;
                return (
                  <div
                    key={entry.userId}
                    className={`grid gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-center ${
                      isCurrentUser ? "rounded-2xl bg-[var(--accent)]/5 px-4" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Contributor
                      </p>
                      <p className="mt-1 font-semibold">
                        {entry.name ?? entry.email}
                        {isCurrentUser ? (
                          <span className="ml-2 text-xs font-semibold text-[var(--accent)]">
                            You
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {entry.reviewCount} review{entry.reviewCount === 1 ? "" : "s"}
                        {entry.badgeCount > 0
                          ? ` | ${entry.badgeCount} contribution signal${entry.badgeCount === 1 ? "" : "s"}`
                          : ""}
                        {entry.avgRating !== null ? ` | ${entry.avgRating.toFixed(1)} avg rating` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-ambient)]">
            <p className="text-sm font-semibold text-[var(--accent)]">How this view works</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              This private view summarizes cohort participation. Ordering uses contribution
              activity, but point totals stay internal.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-ambient)]">
            <p className="text-sm font-semibold text-[var(--accent)]">What to do next</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Add a vendor review, answer an open request, or nominate a helpful founder to
              improve the cohort knowledge base.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-ambient)]">
            <p className="text-sm font-semibold text-[var(--accent)]">Privacy note</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              This private view is cohort-scoped. Public rankings hide names and stay hidden
              for small cohorts.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
