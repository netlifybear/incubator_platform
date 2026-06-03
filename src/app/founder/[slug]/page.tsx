import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicFounderDisplayName } from "@/lib/founder-profile-presenter";
import { isAlumni } from "@/lib/tenant-policy";
import { getPublicFounderProfile } from "@/lib/founder-profiles";
import { getFounderBadges } from "@/lib/badges";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CopyLinkButton } from "@/app/components/copy-link-button";
import { ShareProfileButton } from "./share-profile-button";
import { ProfileViewTracker } from "./profile-view-tracker";

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
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://incubator-trust.vercel.app";
  const cohortTag = founder.cohort?.name ?? "an incubator cohort";
  const bioTag = founder.bio ? `${founder.bio} ` : "";
  const description = `${bioTag}Verified founder in ${cohortTag} — public-safe credibility profile with contribution tags and cohort context.`;

  return {
    title: `${displayName} | Founder Profile`,
    description,
    metadataBase: new URL(baseUrl),
    alternates: { canonical: `/founder/${slug}` },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} | ${cohortTag}`,
      description,
      images: [`${baseUrl}/api/badge/${slug}`],
    },
    openGraph: {
      title: `${displayName} | ${cohortTag}`,
      description,
      type: "profile",
      siteName: "Incubator Trust",
      url: `/founder/${slug}`,
      username: slug,
      images: [{ url: `${baseUrl}/api/badge/${slug}`, width: 240, height: 80, alt: `${displayName} credibility tag` }],
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
  const [helpfulVoteCount, reviewStats, session] = await Promise.all([
    prisma.helpfulVote.count({
      where: {
        value: true,
        review: { userId: founder.id },
      },
    }),
    prisma.review.aggregate({
      where: { userId: founder.id },
      _avg: { rating: true },
      _count: true,
    }),
    getServerSession(authOptions),
  ]);

  const reviewedCategories = await prisma.review.findMany({
    where: { userId: founder.id },
    select: { vendor: { select: { category: true } } },
    distinct: ["vendorId"],
  });
  const knowsAbout = [...new Set(reviewedCategories.map((r) => r.vendor.category))].sort();

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

  if (founder.startupName) {
    if (founder.startupUrl) {
      jsonLd.worksFor = {
        "@type": "Organization",
        name: founder.startupName,
        url: founder.startupUrl,
      };
    } else {
      jsonLd.worksFor = {
        "@type": "Organization",
        name: founder.startupName,
      };
    }
  }

  if (founder.image) {
    jsonLd.image = founder.image;
  }

  if (knowsAbout.length > 0) {
    jsonLd.knowsAbout = knowsAbout;
  }

  if (reviewStats._count > 0 && reviewStats._avg.rating !== null) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Math.round(reviewStats._avg.rating * 10) / 10,
      bestRating: 5,
      worstRating: 1,
      reviewCount: reviewStats._count,
    };
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <ProfileViewTracker slug={slug} disabled={session?.user?.id === founder.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Public founder profile
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight">
          {displayName}
          {isAlumni(founder) ? (
            <span className="ml-3 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800 align-middle">
              Alumni
            </span>
          ) : null}
        </h1>
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
            <Link
              href={`/cohorts/${founder.cohort.slug}`}
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Verified member of {founder.cohort.name}
            </Link>
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
        <div className="mt-6 flex flex-wrap gap-3">
          <CopyLinkButton url={`${process.env.NEXTAUTH_URL ?? "https://incubator-trust.vercel.app"}/founder/${slug}`} />
          <ShareProfileButton name={displayName} slug={slug} />
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
          <h2 className="text-2xl font-semibold">Contribution signals</h2>
          <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <p>
              <span className="font-semibold text-[var(--foreground)]">{reviewStats._count}</span>{" "}
              review{reviewStats._count === 1 ? "" : "s"} written
              {reviewStats._avg.rating !== null ? ` with ${Math.round(reviewStats._avg.rating * 10) / 10}/5 avg rating` : ""}
            </p>
            <p>
              <span className="font-semibold text-[var(--foreground)]">{badges.length}</span>{" "}
              contribution tag{badges.length === 1 ? "" : "s"}
            </p>
            <p>
              <span className="font-semibold text-[var(--foreground)]">{helpfulVoteCount}</span>{" "}
              helpful vote{helpfulVoteCount === 1 ? "" : "s"} received
            </p>
          </div>
          <Link
            href={`/founder/${slug}/credibility`}
            className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
          >
            View credibility report
          </Link>
          {founder.cohort && (
            <Link
              href={`/leaderboard/public?cohort=${founder.cohort.slug}`}
              className="mt-3 block text-sm font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
            >
              View cohort contribution summary
            </Link>
          )}
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
        <h2 className="text-lg font-semibold">Portable credibility tag</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Embed this tag on your startup website to show your verified cohort credibility.
        </p>
        <div className="mt-4 overflow-x-auto">
          <code className="block whitespace-pre rounded-2xl bg-[var(--panel-strong)] p-4 text-xs text-[var(--muted)]">
            {`<img src="${process.env.NEXTAUTH_URL ?? "https://incubator-trust.vercel.app"}/api/badge/${slug}" alt="Incubator Trust credibility tag" width="240" height="80" />`}
          </code>
        </div>
        <CopyLinkButton
          url={`${process.env.NEXTAUTH_URL ?? "https://incubator-trust.vercel.app"}/api/badge/${slug}`}
          label="Copy tag image URL"
        />
      </section>

      {session?.user ? (
        <Link href="/" className="text-sm font-semibold text-[var(--accent)] hover:underline">
          Browse the private vendor directory
        </Link>
      ) : (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Join your cohort&apos;s trust network</h2>
          <p className="mt-2 leading-7 text-[var(--muted)]">
            Incubator Trust turns cohort knowledge into portable credibility. Sign in to find
            trusted vendor recommendations from founders in your incubator.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/signin"
              className="inline-flex rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white"
            >
              Sign in with your incubator email
            </Link>
            <Link
              href="/founders"
              className="inline-flex rounded-full bg-[var(--panel-strong)] px-6 py-3 font-semibold"
            >
              Browse all founders
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
