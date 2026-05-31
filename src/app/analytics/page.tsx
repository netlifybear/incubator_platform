import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { getCohortAnalytics } from "@/lib/analytics";

export default async function AnalyticsPage() {
  const founder = await getCurrentFounder();

  if (!founder || !founder.cohortId || !founder.cohort) {
    redirect("/signin");
  }

  const analytics = await getCohortAnalytics(founder.cohortId);

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <div className="space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight">Cohort Analytics</h1>

        <section>
          <h2 className="text-xl font-semibold">Reviews</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total reviews" value={analytics.reviews.total} />
            <StatCard label="Average length" value={`${analytics.reviews.avgLength} chars`} />
            <StatCard label="With numbers" value={`${analytics.reviews.pctWithNumbers}%`} />
            <StatCard label="With disclosure" value={`${analytics.reviews.pctWithDisclosure}%`} />
            <StatCard label="With service mention" value={`${analytics.reviews.pctWithServiceMention}%`} />
            <StatCard label="Average rating" value={String(analytics.reviews.avgRating)} />
            <StatCard label="Helpful votes" value={analytics.reviews.totalHelpfulVotes} />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Backlinks</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <StatCard label="Unique domains" value={analytics.backlinks.totalDomains} />
            <StatCard
              label="Founders tracking backlinks"
              value={analytics.backlinks.totalFoundersWithBacklinks}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Founders</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <StatCard label="Total founders" value={analytics.founders.total} />
            <StatCard
              label="With public profile"
              value={`${analytics.founders.pctWithPublicProfile}%`}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
