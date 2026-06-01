import { getAdminFlywheelMetrics } from "@/lib/admin-analytics";

type Props = {
  cohortId: string;
};

export async function AdminFlywheelSection({ cohortId }: Props) {
  const metrics = await getAdminFlywheelMetrics(cohortId);

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Flywheel health
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {metrics.totalFounders} founders · {metrics.totalReviews} reviews
          </h2>
        </div>
        <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-sm font-semibold">
          {metrics.totalProfileViews} profile views
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-[var(--panel)] p-4">
          <p className="text-sm text-[var(--muted)]">Public profiles</p>
          <p className="mt-2 text-2xl font-semibold">
            {metrics.foundersWithPublicProfile} / {metrics.totalFounders}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {metrics.pctPublicProfile}% → SEO surface area
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--panel)] p-4">
          <p className="text-sm text-[var(--muted)]">Reviews per founder</p>
          <p className="mt-2 text-2xl font-semibold">
            {metrics.reviewsPerFounder}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {metrics.foundersWithReviews} founders with ≥1 review
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--panel)] p-4">
          <p className="text-sm text-[var(--muted)]">Backlinks</p>
          <p className="mt-2 text-2xl font-semibold">
            {metrics.backlinks.verified} verified
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {metrics.backlinks.foundersWithBacklinks} founders · {metrics.backlinks.pending} pending
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--panel)] p-4">
          <p className="text-sm text-[var(--muted)]">Peer requests</p>
          <p className="mt-2 text-2xl font-semibold">
            {metrics.targetedRequests} open
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {metrics.avgProfileViews} avg profile views
          </p>
        </div>
      </div>
    </section>
  );
}

export function FlywheelFallback() {
  return (
    <section className="animate-pulse rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="h-4 w-32 rounded-full bg-[var(--panel-strong)]" />
      <div className="mt-3 h-7 w-64 rounded-full bg-[var(--panel-strong)]" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-[var(--panel)] p-4">
            <div className="h-4 w-16 rounded-full bg-[var(--panel-strong)]" />
            <div className="mt-3 h-7 w-12 rounded-full bg-[var(--panel-strong)]" />
          </div>
        ))}
      </div>
    </section>
  );
}
