import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getLeaderboard } from "@/lib/leaderboard";
import { PUBLIC_LEADERBOARD_MIN_FOUNDERS } from "@/lib/points";
import { shouldShowPublicLeaderboard } from "@/lib/leaderboard-privacy";

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
    return { title: "Cohort Leaderboard" };
  }

  const cohort = await prisma.cohort.findUnique({
    where: { slug: cohortSlug },
    select: { name: true },
  });

  return {
    title: cohort ? `${cohort.name} Leaderboard` : "Cohort Leaderboard",
    description: cohort
      ? `Public reputation ranking for ${cohort.name}. See who contributes most to the cohort.`
      : "Public cohort reputation leaderboard.",
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
        <h1 className="text-4xl font-semibold tracking-tight">Cohort Leaderboard</h1>
        <p className="text-center leading-7 text-[var(--muted)]">
          Select a cohort from a founder profile to view its public ranking.
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

  const entries = await getLeaderboard(cohort.id);
  const isBelowPrivacyThreshold = !shouldShowPublicLeaderboard(entries.length);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-10">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Public ranking
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">{cohort.name}</h1>
        <p className="mt-4 max-w-xl leading-7 text-[var(--muted)]">
          Reputation ranking based on quality-adjusted review points, badges, and helpful votes.
          Founder names are not shown publicly, and small cohorts stay private.
        </p>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        {isBelowPrivacyThreshold ? (
          <div className="rounded-2xl bg-[var(--panel)] p-5">
            <p className="font-semibold">Public ranking hidden for privacy</p>
            <p className="mt-2 leading-7 text-[var(--muted)]">
              This cohort has {entries.length} founder{entries.length === 1 ? "" : "s"}.
              Public rankings appear only after at least {PUBLIC_LEADERBOARD_MIN_FOUNDERS} founders
              have joined, reducing the risk of identifying members by activity patterns.
            </p>
          </div>
        ) : entries.length === 0 ? (
          <p className="text-[var(--muted)]">No founders in this cohort yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div
                key={entry.userId}
                className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--panel-strong)] text-lg font-bold">
                  {index === 0
                    ? "\uD83E\uDD47"
                    : index === 1
                      ? "\uD83E\uDD48"
                      : index === 2
                        ? "\uD83E\uDD49"
                        : `#${index + 1}`}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Founder</p>
                  <p className="text-sm text-[var(--muted)]">
                    {entry.reviewCount} review
                    {entry.reviewCount === 1 ? "" : "s"}
                    {entry.badgeCount > 0
                      ? ` \u00B7 ${entry.badgeCount} badge${entry.badgeCount === 1 ? "" : "s"}`
                      : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{entry.points}</p>
                  <p className="text-xs text-[var(--muted)]">points</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-center text-sm text-[var(--muted)]">
        <Link href="/" className="font-semibold text-[var(--accent)]">
          Incubator Trust
        </Link>
        {' \u2014 '}cohort knowledge turned into portable reputation.
      </p>
    </main>
  );
}
