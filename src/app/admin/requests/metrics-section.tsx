import { getAdminTrustMetrics } from "@/lib/admin-analytics";

type MetricsSectionProps = {
  cohortId: string;
};

export async function AdminMetricsSection({ cohortId }: MetricsSectionProps) {
  const metrics = await getAdminTrustMetrics(cohortId);

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Trust loop health
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{metrics.healthMessage}</h2>
        </div>
        <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-sm font-semibold">
          {metrics.totalVendors} vendors
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-[var(--panel)] p-4">
          <p className="text-sm text-[var(--muted)]">Requests</p>
          <p className="mt-2 text-2xl font-semibold">
            {metrics.openRequests} open
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {metrics.fulfilledRequests} fulfilled, {metrics.closedRequests} closed
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--panel)] p-4">
          <p className="text-sm text-[var(--muted)]">Reviews</p>
          <p className="mt-2 text-2xl font-semibold">
            {metrics.reviews.total} total
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {metrics.reviews.firsthand} firsthand
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--panel)] p-4">
          <p className="text-sm text-[var(--muted)]">Invites</p>
          <p className="mt-2 text-2xl font-semibold">
            {metrics.invites.open} open
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {metrics.invites.accepted} accepted, {metrics.invites.expired} expired,{" "}
            {metrics.invites.revoked} revoked
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--panel)] p-4">
          <p className="text-sm text-[var(--muted)]">Directory</p>
          <p className="mt-2 text-2xl font-semibold">
            {metrics.totalVendors} vendors
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Cohort-scoped and private
          </p>
        </div>
      </div>
    </section>
  );
}

export function MetricsFallback() {
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
