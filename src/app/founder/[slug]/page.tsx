import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicFounderDisplayName } from "@/lib/founder-profile-presenter";
import { getPublicFounderProfile } from "@/lib/founder-profiles";
import { getFounderBadges } from "@/lib/badges";
import { getFounderPoints, getFounderCohortRank } from "@/lib/points";
import { CopyLinkButton } from "@/app/components/copy-link-button";

type FounderProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: FounderProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const founder = await getPublicFounderProfile(slug);

  if (!founder) {
    return {
      title: "Founder profile not found",
    };
  }

  const displayName = publicFounderDisplayName(founder);

  const cohortTag = founder.cohort?.name ?? "an incubator cohort";

  return {
    title: `${displayName} | Founder Profile`,
    description: founder.bio ?? `${displayName} is a verified founder in ${cohortTag}.`,
    openGraph: {
      title: `${displayName} | ${cohortTag}`,
      description: founder.bio ?? `Verified founder in ${cohortTag} with portable cohort reputation.`,
      type: "profile",
      siteName: "Incubator Trust",
    },
  };
}

export default async function FounderProfilePage({ params }: FounderProfilePageProps) {
  const { slug } = await params;
  const founder = await getPublicFounderProfile(slug);

  if (!founder) {
    notFound();
  }

  const displayName = publicFounderDisplayName(founder);
  const badges = await getFounderBadges(founder.email);
  const [points, rank] = await Promise.all([
    getFounderPoints(founder.id),
    founder.cohort?.id ? getFounderCohortRank(founder.id, founder.cohort.id) : Promise.resolve(null),
  ]);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
  };

  if (founder.bio) {
    jsonLd.description = founder.bio;
  }

  if (founder.cohort?.name) {
    jsonLd.affiliation = {
      "@type": "Organization",
      name: founder.cohort.name,
    };
  }

  if (founder.startupUrl) {
    jsonLd.url = founder.startupUrl;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Public founder profile
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight">{displayName}</h1>
        {founder.bio ? (
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            {founder.bio}
          </p>
        ) : (
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Verified founder profile. More public context can be added later.
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {founder.cohort ? (
            <span className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
              Verified member of {founder.cohort.name}
            </span>
          ) : null}
          {badges.map((badge) => (
            <span
              key={badge.type}
              className="rounded-full bg-[var(--panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]"
              title={badge.label}
            >
              {badge.icon} {badge.label}
            </span>
          ))}
          <span className="rounded-full bg-[var(--panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]">
            {founder.profileCompletePercentage}% profile complete
          </span>
        </div>
        <div className="mt-6">
          <CopyLinkButton url={`${process.env.NEXTAUTH_URL ?? "https://incubator-trust.vercel.app"}/founder/${slug}`} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Startup</h2>
          {founder.startupName ? (
            <p className="mt-2 text-lg font-medium">
              {founder.startupName}
            </p>
          ) : null}
          {founder.startupUrl ? (
            <a
              href={founder.startupUrl}
              className="mt-4 inline-flex rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white"
              rel="noreferrer"
              target="_blank"
            >
              Visit startup
            </a>
          ) : (
            <p className="mt-4 leading-7 text-[var(--muted)]">
              Startup link has not been added yet.
            </p>
          )}
        </article>

        <article className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Reputation</h2>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-[var(--accent)]">{points.total}</span>
            <span className="text-sm text-[var(--muted)]">pts</span>
          </div>
          {rank !== null && (
            <p className="mt-1 text-sm text-[var(--muted)]">
              #{rank.rank} of {rank.total} founders in {founder.cohort?.name}
            </p>
          )}
          {founder.cohort && (
            <Link
              href={`/leaderboard/public?cohort=${founder.cohort.slug}`}
              className="mt-3 inline-flex text-sm font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
            >
              View full cohort ranking
            </Link>
          )}
          <div className="mt-4 space-y-1 text-sm text-[var(--muted)]">
            <p>{points.breakdown.reviews} from reviews</p>
            <p>{points.breakdown.badges} from badges</p>
            <p>{points.breakdown.helpfulVotes} from helpful votes</p>
          </div>
        </article>

        <article className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Privacy boundary</h2>
          <p className="mt-4 leading-7 text-[var(--muted)]">
            Private cohort reviews, vendor requests, invite history, and internal admin
            activity are not shown on public profiles.
          </p>
        </article>
      </section>

      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <h2 className="text-lg font-semibold">Portable reputation badge</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Embed this badge on your startup website to show your verified cohort reputation.
        </p>
        <div className="mt-4 overflow-x-auto">
          <code className="block whitespace-pre rounded-2xl bg-[var(--panel-strong)] p-4 text-xs text-[var(--muted)]">
            {`<img src="${process.env.NEXTAUTH_URL ?? "https://incubator-trust.vercel.app"}/api/badge/${slug}" alt="Incubator Trust reputation badge" width="240" height="80" />`}
          </code>
        </div>
        <CopyLinkButton
          url={`${process.env.NEXTAUTH_URL ?? "https://incubator-trust.vercel.app"}/api/badge/${slug}`}
          label="Copy badge image URL"
        />
      </section>

      <Link href="/" className="text-sm font-semibold text-[var(--accent)]">
        Sign in to view the private vendor directory
      </Link>
    </main>
  );
}
