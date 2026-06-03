import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCohortImpactSummary } from "@/lib/impact";
import {
  PUBLIC_LEADERBOARD_MIN_FOUNDERS,
  shouldShowPublicLeaderboard,
} from "@/lib/leaderboard-privacy";

type PublicLeaderboardProps = {
  searchParams?: Promise<{
    cohort?: string;
  }>;
};

export async function generateMetadata({
  searchParams,
}: PublicLeaderboardProps): Promise<Metadata> {
  const params = await searchParams;
  const cohortSlug = params?.cohort;

  if (!cohortSlug) {
    return { title: "Cohort Contribution Summary" };
  }

  const cohort = await prisma.cohort.findUnique({
    where: { slug: cohortSlug },
    select: { name: true },
  });

  return {
    title: cohort ? `${cohort.name} Contribution Summary` : "Cohort Contribution Summary",
    description: cohort
      ? `Public contribution summary for ${cohort.name}. See aggregate cohort activity without exposing founder identities.`
      : "Public cohort contribution summary.",
  };
}

export default async function PublicLeaderboardPage({
  searchParams,
}: PublicLeaderboardProps) {
  const params = await searchParams;
  const cohortSlug = params?.cohort;

  if (!cohortSlug) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 py-10">
        <h1 className="text-4xl font-semibold tracking-tight">Cohort Contribution Summary</h1>
        <p className="text-center leading-7 text-[var(--muted)]">
          Select a cohort from a founder profile to view its public contribution summary.
        </p>
        <Link href="/" className="rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white">
          Incubator Trust
        </Link>
      </main>
    );
  }

  const cohort = await prisma.cohort.findUnique({
    where: { slug: cohortSlug },
    select: { id: true, name: true },
  });

  if (!cohort) {
    notFound();
  }

  const impact = await getCohortImpactSummary(cohort.id);
  const isBelowPrivacyThreshold = !shouldShowPublicLeaderboard(impact.founderCount);
  const metrics = [
    { label: "Founders in cohort", value: impact.founderCount },
    { label: "Active contributors", value: impact.activeContributorCount },
    { label: "Reviews shared", value: impact.reviewCount },
    { label: "Helpful votes", value: impact.helpfulVoteCount },
  ];
  const publicSummaryJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${cohort.name} Public Contribution Summary`,
    description:
      "Public-safe aggregate contribution summary for an incubator cohort. Founder names and private activity are withheld.",
    about: {
      "@type": "Organization",
      name: cohort.name,
    },
    additionalProperty: metrics.map((metric) => ({
      "@type": "PropertyValue",
      name: metric.label,
      value: metric.value,
    })),
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(publicSummaryJsonLd) }}
      />
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Public contribution summary
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">{cohort.name}</h1>
        <p className="mt-4 max-w-xl leading-7 text-[var(--muted)]">
          Aggregate cohort activity based on reviews, helpful votes, and contribution
          signals. Founder names are not shown publicly, and small cohorts stay private.
        </p>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        {isBelowPrivacyThreshold ? (
          <div className="rounded-2xl bg-[var(--panel)] p-5">
            <p className="font-semibold">Public summary hidden for privacy</p>
            <p className="mt-2 leading-7 text-[var(--muted)]">
              This cohort has {impact.founderCount} founder{impact.founderCount === 1 ? "" : "s"}.
              Public summaries appear only after at least {PUBLIC_LEADERBOARD_MIN_FOUNDERS} founders
              have joined, reducing the risk of identifying members by activity patterns.
            </p>
          </div>
        ) : impact.founderCount === 0 ? (
          <p className="text-[var(--muted)]">No founders in this cohort yet.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
                >
                  <p className="text-sm text-[var(--muted)]">{metric.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-xl font-semibold">Contributor patterns</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Contributors are anonymized publicly. Ordering uses contribution activity,
                but point totals stay internal.
              </p>
              <div className="mt-4 space-y-3">
                {impact.topContributors.map((entry) => (
                  <div
                    key={entry.userId}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
                  >
                    <p className="font-semibold">Contributor</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {entry.reviewCount} review{entry.reviewCount === 1 ? "" : "s"}
                      {entry.contributionSignalCount > 0
                        ? ` | ${entry.contributionSignalCount} contribution signal${entry.contributionSignalCount === 1 ? "" : "s"}`
                        : ""}
                      {entry.helpfulVoteCount > 0
                        ? ` | ${entry.helpfulVoteCount} helpful vote${entry.helpfulVoteCount === 1 ? "" : "s"}`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <p className="text-center text-sm text-[var(--muted)]">
        <Link href="/" className="font-semibold text-[var(--accent)]">
          Incubator Trust
        </Link>
        {" | "}cohort knowledge turned into portable credibility.
      </p>
    </main>
  );
}
