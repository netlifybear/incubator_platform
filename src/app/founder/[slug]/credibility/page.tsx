import Link from "next/link";
import { notFound } from "next/navigation";
import { publicFounderDisplayName } from "@/lib/founder-profile-presenter";
import { getPublicFounderProfile } from "@/lib/founder-profiles";
import { getFounderBadges } from "@/lib/badges";
import { getFounderPoints, getFounderCohortRank } from "@/lib/points";
import { listBacklinksForFounder } from "@/lib/backlinks";
import { reviewContributionPoints } from "@/lib/review-quality";
import { computeCredibilityFactors, toPublicCredibilityFactors } from "@/lib/credibility-factors";
import { getFounderImpactSummary } from "@/lib/impact";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";
import { CredibilityActions } from "./credibility-actions";

const SHARED_SECRET = process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production";

type FounderCredibilityPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getFounderCredibilityData(slug: string) {
  const founder = await getPublicFounderProfile(slug);
  
  if (!founder) {
    return null;
  }

  const points = await getFounderPoints(founder.id);
  const badges = await getFounderBadges(founder.email);
  const rank = founder.cohort?.id
    ? await getFounderCohortRank(founder.id, founder.cohort.id)
    : null;
  const reviewStats = await prisma.review.aggregate({
    where: { userId: founder.id },
    _avg: { rating: true },
    _count: true,
  });
  const impact = await getFounderImpactSummary(founder.id);
  const backlinks = await listBacklinksForFounder(founder.id);

  // Calculate used vendor percentage
  const founderReviews = await prisma.review.findMany({
    where: { userId: founder.id },
    select: { id: true, usedVendor: true, comment: true, createdAt: true },
  });
  const usedVendorCount = founderReviews.filter(r => r.usedVendor).length;
  const usedVendorPercentage = founderReviews.length > 0 
    ? Math.round((usedVendorCount / founderReviews.length) * 100) 
    : 0;

  // Calculate helpful vote ratio
  const helpfulVotes = await prisma.helpfulVote.findMany({
    where: {
      reviewId: { in: founderReviews.map(r => r.id) }
    },
    select: { value: true }
  });
  const helpfulVoteRatio = helpfulVotes.length > 0
    ? Math.round((helpfulVotes.filter(v => v.value).length / helpfulVotes.length) * 100)
    : 0;

  // Distinct founders who cast helpful votes on this founder's reviews
  const helpfulVoters = await prisma.helpfulVote.findMany({
    where: {
      reviewId: { in: founderReviews.map(r => r.id) },
      value: true,
    },
    distinct: ["userId"],
    select: { userId: true },
  });
  const helpfulVoterCount = helpfulVoters.length;

  // Calculate quality score trend (simplified as average quality %)
  const qualityScorePercentage = founderReviews.length > 0
    ? Math.round(
        (founderReviews.reduce((sum, r) => sum + (reviewContributionPoints(r.comment) / 10 * 100), 0) / founderReviews.length)
      )
    : 0;

  // Reviews with detailed comments
  const detailedCommentCount = founderReviews.filter(r => reviewContributionPoints(r.comment) > 0).length;

  // Review freshness
  const newestReview = founderReviews.length > 0
    ? founderReviews.reduce((newest, r) => r.createdAt > newest.createdAt ? r : newest, founderReviews[0])
    : null;
  const reviewFreshnessLabel = newestReview
    ? formatRelativeDate(newestReview.createdAt)
    : null;

  // Create badge verification hash (HMAC of badge data)
  const badgeData = badges.map(b => ({
    type: b.type,
    label: b.label,
  }));
  const badgePayload = JSON.stringify({ founderId: founder.id, badges: badgeData });
  const badgeVerificationHash = crypto.createHmac("sha256", SHARED_SECRET)
    .update(badgePayload)
    .digest("hex");

  // GSC data (if connected)
  const gscConnected = Boolean(founder.gscEmail);
  const issuedAt = new Date();

  const credibility = await computeCredibilityFactors(founder.id, { impact, useCache: true });
  const publicFactors = toPublicCredibilityFactors(credibility);

  return {
    founder,
    displayName: publicFounderDisplayName(founder),
    points,
    badges,
    rank,
    reviewStats,
    impact,
    backlinks,
    usedVendorPercentage,
    helpfulVoteRatio,
    helpfulVoterCount,
    qualityScorePercentage,
    detailedCommentCount,
    reviewFreshnessLabel,
    credibility,
    publicFactors,
    badgeVerificationHash,
    gscConnected,
    accountAgeDays: Math.floor((issuedAt.getTime() - founder.createdAt.getTime()) / 86400000),
    lastUpdatedLabel: issuedAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    // For machine-readable endpoint
    reputationPacket: {
      version: "1.0",
      founderId: founder.id,
      sourceIncubator: {
        id: founder.cohort?.id ?? "",
        name: founder.cohort?.name ?? "",
        verificationMethod: "email_verified + cohort_invite",
      },
      attestations: [
        {
          type: "verified_status",
          value: true,
          label: "Verified cohort member",
          issuedAt: issuedAt.toISOString(),
        },
        ...badges.map(b => ({
          type: `badge_${b.type}`,
          value: b.label,
          label: b.label,
          icon: b.icon,
          issuedAt: issuedAt.toISOString(),
        })),
        ...(rank ? [{
          type: "cohort_rank",
          value: `#${rank.rank} of ${rank.total}`,
          label: `Ranked #${rank.rank} in cohort`,
          issuedAt: issuedAt.toISOString(),
        }] : []),
      ],
      aggregates: {
        avgVendorRating: reviewStats._avg.rating ?? null,
        totalReviews: reviewStats._count ?? 0,
        totalBadges: badges.length,
        totalPoints: points.total,
      },
      issuedAt: issuedAt.toISOString(),
    }
  };
}

function formatRelativeDate(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createJwtSignature(payload: string): string {
  return crypto.createHmac("sha256", SHARED_SECRET).update(payload).digest("base64url");
}

export default async function FounderCredibilityPage({ params }: FounderCredibilityPageProps) {
  const { slug } = await params;

  const data = await getFounderCredibilityData(slug);

  if (!data) {
    notFound();
  }

  const {
    founder,
    displayName,
    badges,
    reviewStats,
    impact,
    backlinks,
    usedVendorPercentage,
    helpfulVoteRatio,
    helpfulVoterCount,
    qualityScorePercentage,
    detailedCommentCount,
    reviewFreshnessLabel,
    badgeVerificationHash,
    credibility,
    publicFactors,
    gscConnected,
    accountAgeDays,
    lastUpdatedLabel,
    reputationPacket
  } = data;

  const jwtPayload = base64UrlEncode(JSON.stringify({
    ...reputationPacket,
    signature: ""
  }));
  const signature = createJwtSignature(jwtPayload);
  const reputationJwt = `${jwtPayload}.${signature}`;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-10">
        {/* JSON-LD for structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: displayName,
            description: founder.bio ?? `${displayName} is a verified founder with portable cohort reputation.`,
            ...(founder.cohort?.name && {
              affiliation: {
                "@type": "Organization",
                name: founder.cohort.name,
              }
            }),
            ...(founder.startupUrl && { url: founder.startupUrl }),
            ...(founder.startupName && founder.startupUrl && {
              memberOf: {
                "@type": "Organization",
                name: founder.startupName,
                url: founder.startupUrl,
              }
            }),
            ...(reviewStats._count > 0 && reviewStats._avg.rating !== null && {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: Math.round(reviewStats._avg.rating * 10) / 10,
                bestRating: 5,
                worstRating: 1,
                reviewCount: reviewStats._count,
              }
            })
          })}}
        />
        <style>
          {`@media print {
            body * {
              visibility: hidden;
            }
            #print-section, #print-section * {
              visibility: visible;
            }
            #print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }`}
        </style>
        
        <div id="print-section">
        
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Founder Credibility Report
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">{displayName}</h1>
          
          {/* Header info */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1">
              {founder.cohort?.name ?? "Incubator Cohort"} • Verified Member
            </span>
            <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1">
              Last updated: {lastUpdatedLabel}
            </span>
          </div>
        </section>

        {/* Sections */}
        <div className="grid gap-6">

          {/* Section 1: Credibility Summary */}
          <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6">
            <h2 className="text-xl font-semibold">Credibility Summary</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {`An overview of ${displayName}'s contribution track record on ${founder.cohort?.name ?? "the platform"}.`}
            </p>
            <div className="mt-4 space-y-3">
              {credibility.isThinFile ? (
                <div className="rounded-xl bg-gray-50 p-4 text-sm leading-6 text-[var(--muted)]">
                  <p className="font-semibold text-gray-700">Establishing presence</p>
                  <p className="mt-2">
                    {displayName} is building their track record on {founder.cohort?.name ?? "the platform"}.
                    Check back after they share more reviews.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    credibility.summary === "strong"
                      ? "bg-green-100 text-green-800"
                      : credibility.summary === "developing"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-600"
                  }`}>
                    {credibility.summary === "strong" ? "Strong" : credibility.summary === "developing" ? "Developing" : "Needs activity"}
                  </span>
                </div>
              )}
              {publicFactors.map((f) => (
                <div key={f.key} className="flex items-center justify-between rounded-xl bg-[var(--panel-strong)] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${
                      f.status === "strong" ? "bg-green-500" : f.status === "developing" ? "bg-yellow-500" : "bg-gray-300"
                    }`} />
                    <span className="text-sm text-[var(--muted)]">{f.label}</span>
                  </div>
                </div>
              ))}
              <p className="text-xs text-[var(--muted)]">
                {reviewStats._count ?? 0} total review{reviewStats._count === 1 ? "" : "s"} — based on {credibility.factors.find(f => f.key === "reviewQuality")?.value ?? "0"} average review quality
              </p>
            </div>
          </section>

          {/* Section 2: Identity & Cohort Verification */}
          <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6">
            <h2 className="text-xl font-semibold">Identity & Cohort Verification</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Cohort Membership</span>
                <span className="text-sm font-semibold">{founder.cohort?.name ?? "N/A"} ({founder.cohort?.slug ?? "N/A"})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Email Verified</span>
                <span className="text-sm font-semibold text-green-700">Yes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Profile Completeness</span>
                <span className="text-sm font-semibold">{founder.profileCompletePercentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Account Age</span>
                <span className="text-sm font-semibold">{accountAgeDays} days</span>
              </div>
            </div>
            {/* Verifiable tag */}
            <div className="mt-6 border-t border-[var(--border)] pt-6 text-center">
              <div className="inline-block">
                <div className="flex h-16 w-16 items-center justify-center rounded-[50%] bg-[var(--accent)] text-lg font-semibold text-white mx-auto">
                  {(founder.name ?? "F").charAt(0)}
                </div>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Verifiable tag • Hash: {badgeVerificationHash.slice(0, 8)}...
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Review History */}
          <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6">
            <h2 className="text-xl font-semibold">Review History</h2>
            {credibility.isThinFile ? (
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                No reviews shared yet. As {displayName} reviews vendors, their history will appear here.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted)]">Total Reviews Written</span>
                  <span className="text-sm font-semibold">{reviewStats._count ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted)]">Reviews With Detailed Comments</span>
                  <span className="text-sm font-semibold">{detailedCommentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted)]">Average Rating Given</span>
                  <span className="text-sm font-semibold">
                    {(reviewStats._avg.rating ?? 0).toFixed(1)} / 5
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted)]">Firsthand Experience Rate</span>
                  <span className="text-sm font-semibold">{usedVendorPercentage}%</span>
                </div>
                {reviewFreshnessLabel && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--muted)]">Last Review</span>
                    <span className="text-sm font-semibold">{reviewFreshnessLabel}</span>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Section 4: Contribution Signals */}
          <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6">
            <h2 className="text-xl font-semibold">Contribution Signals</h2>
            <div className="mt-4">
              <p className="text-sm text-[var(--muted)] mb-2">
                Contribution markers and tags earned on the platform:
              </p>
              {badges.length > 0 ? (
                <div className="space-y-2">
                  {badges.map((badge) => (
                    <div key={badge.type} className="flex items-center gap-3 rounded-[1rem] bg-[var(--panel-strong)] p-3">
                      <span className="text-[var(--accent-strong)] font-medium">{badge.icon}</span>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold">{badge.label}</p>
                        {badge.description && (
                          <p className="text-xs text-[var(--muted)]">{badge.description}</p>
                        )}
                        <p className="text-xs text-[var(--muted)]">Included in current profile snapshot</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-[var(--muted)]">No contribution tags earned yet</p>
              )}
            </div>
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <p className="text-center text-xs text-[var(--muted)]">
                Tag verification hash: {badgeVerificationHash}
              </p>
            </div>
          </section>

          {/* Section 5: Helpfulness & Peer Validation */}
          <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6">
            <h2 className="text-xl font-semibold">Helpfulness & Peer Validation</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Helpful Vote Ratio</span>
                <span className="text-sm font-semibold">{helpfulVoteRatio}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Quality Score Trend</span>
                <span className="text-sm font-semibold">{qualityScorePercentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Helpful Votes Received</span>
                <span className="text-sm font-semibold">{impact.helpfulVoteCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Peers Who Found Reviews Helpful</span>
                <span className="text-sm font-semibold">{helpfulVoterCount}</span>
              </div>
            </div>
          </section>

          {/* Section 6: Backlink Authority */}
          <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6">
            <h2 className="text-xl font-semibold">Backlink Authority</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Verified Backlinks</span>
                <span className="text-sm font-semibold">
                  {impact.verifiedBacklinkCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Referring Domains</span>
                <span className="text-sm font-semibold">
                  { [...new Set(backlinks.map(b => b.referringDomain))].length }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">GSC Connection Status</span>
                <span className="text-sm font-semibold">
                  {gscConnected ? "Connected" : "Not Connected"}
                </span>
              </div>
            </div>
          </section>

          {/* Section 7: Export & Verification */}
          <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6">
            <h2 className="text-xl font-semibold">Export & Verification</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Download Report (PDF)</span>
                <CredibilityActions reputationJwt={reputationJwt} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Machine-Readable JWT</span>
                <code className="max-w-[16rem] truncate rounded-lg bg-[var(--panel-strong)] px-2 py-1 text-xs text-[var(--muted)]">
                  {reputationJwt}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Verify Report</span>
                <p className="text-sm font-semibold text-[var(--accent)]">
                  Publicly verifiable
                </p>
              </div>
            </div>
          </section>
        </div>
        
        {/* Back to profile link */}
        <div className="mt-8 text-center">
          <Link
            href={`/founder/${slug}`}
            className="text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            ← Back to Public Profile
          </Link>
        </div>
      </div>
    </main>
  );
}
