import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { HelpfulVoteButton } from "@/app/components/helpful-vote-button";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { getFounderDisplayName } from "@/lib/tenant-policy";
import { getVendorForCohort, getPublicVendor, getConsumerReviewsForVendor, getAverageRating, getSimilarVendorsInOtherCohorts } from "@/lib/vendors";
import { formatAverageRating } from "@/lib/vendor-presenter";
import { askForDetailsAction, createReviewAction, createConsumerReviewAction } from "./actions";
import { ReviewForm } from "./review-form";
import { QuickReviewForm } from "./quick-review-form";
import { AskForDetailsButton } from "./ask-for-details-button";
import { reviewContributionPoints } from "@/lib/review-quality";

type VendorPageProps = {
  params: Promise<{
    vendorId: string;
  }>;
  searchParams?: Promise<{
    mode?: string;
  }>;
};

type VendorJsonLdInput = {
  name: string;
  category: string;
};

type ConsumerReviewJsonLdInput = {
  displayName: string | null;
  createdAt: Date;
  comment: string | null;
  rating: number;
};

function generateVendorReviewJSONLD(
  vendor: VendorJsonLdInput,
  consumerReviews: ConsumerReviewJsonLdInput[],
) {
  if (consumerReviews.length === 0) {
    return null;
  }

  const averageRating = getAverageRating(consumerReviews);
  const ratingValue = averageRating !== null ? parseFloat(averageRating.toFixed(1)) : null;

  const reviewObjects = consumerReviews.map((review) => ({
    "@type": "Review",
    author: {
      "@type": "Person",
      name: review.displayName ?? "Anonymous",
    },
    datePublished: review.createdAt.toISOString(),
    reviewBody: review.comment ?? "",
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating.toString(),
    },
  }));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: vendor.name,
    category: vendor.category,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: ratingValue !== null ? ratingValue.toString() : undefined,
      reviewCount: consumerReviews.length.toString(),
      bestRating: "5",
    },
    review: reviewObjects,
  };
}

export default async function VendorPage({ params, searchParams }: VendorPageProps) {
  const founder = await getCurrentFounder();
  const { vendorId } = await params;
  const { mode } = (await searchParams) ?? {};
  const reviewMode = mode === "founder" ? "founder" : "consumer";

  if (reviewMode === "founder" && !founder) {
    redirect("/signin");
  }

  if (founder && !founder.cohortId) {
    notFound();
  }

  const privateVendor = founder?.cohortId ? await getVendorForCohort(vendorId, founder.cohortId) : null;
  const vendor = privateVendor ?? (await getPublicVendor(vendorId));
  if (!vendor) notFound();

  const cohortName = founder?.cohort?.name ?? vendor.cohort?.name ?? "Vendors";
  const consumerReviews = await getConsumerReviewsForVendor(vendorId);
  const founderReviews = privateVendor?.reviews ?? [];
  const averageRating = privateVendor ? getAverageRating(founderReviews) : getAverageRating(consumerReviews);
  const similarVendors = founder?.cohortId
    ? await getSimilarVendorsInOtherCohorts(vendorId, founder.cohortId)
    : [];
  const action = privateVendor && founder ? createReviewAction.bind(null, vendor.id, reviewMode) : null;
  const consumerAction = createConsumerReviewAction.bind(null, vendor.id, vendor.cohortId);
  const boundAskForDetails = founder && founder.cohortId
    ? askForDetailsAction.bind(null, vendor.category, vendor.name, vendor.id, founder.cohortId, founder.id)
    : null;

  // Generate JSON-LD for public consumer reviews (only shown in consumer mode or when not signed in)
  const showJSONLD = reviewMode === "consumer" || !founder;
  const jsonLD = showJSONLD ? generateVendorReviewJSONLD(vendor, consumerReviews) : null;

  return (
    <AppShell founder={founder} cohortName={cohortName}>
      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <section>
        <Link href="/" className="text-sm font-semibold text-[var(--accent)]">
          Back to vendors
        </Link>

        <div className="mt-6 rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            {vendor.category}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            {vendor.name}
          </h1>
          {vendor.contact ? (
            <p className="mt-4 text-lg text-[var(--muted)]">{vendor.contact}</p>
          ) : null}
          <div className="mt-6 inline-flex rounded-full bg-[var(--panel-strong)] px-4 py-2 font-semibold">
            {averageRating === null
              ? "No ratings yet"
              : `${formatAverageRating(averageRating)} average rating`}
          </div>
          {vendor.cohort?.slug ? (
            <div className="mt-4">
              <Link
                href={`/cohorts/${vendor.cohort.slug}`}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--panel-strong)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--accent)]"
              >
                {vendor.cohort.name}
              </Link>
            </div>
          ) : null}
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-semibold">Named founder reviews</h2>
          {!founder ? (
            <p className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 text-[var(--muted)]">
              Sign in as a cohort founder to view named founder reviews.
            </p>
          ) : founderReviews.length === 0 ? (
            <p className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 text-[var(--muted)]">
              No reviews yet. Be the first founder to leave useful context.
            </p>
          ) : (
            founderReviews.map((review) => {
              const upCount = review.helpfulVotes.filter((v) => v.value).length;
              const downCount = review.helpfulVotes.filter((v) => !v.value).length;
              const isOwn = founder ? review.user.id === founder.id : false;
              const userVote = founder
                ? review.helpfulVotes.find((v) => v.userId === founder.id)
                : undefined;
              const qualityScore = reviewContributionPoints(review.comment);
              const qualityPct = Math.min(100, Math.round((qualityScore / 20) * 100));

              return (
              <article
                key={review.id}
                className="rounded-3xl border border-[var(--border)] bg-white/70 p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold" data-review-author={getFounderDisplayName(review.user)}>{getFounderDisplayName(review.user)}</p>
                    <p className="text-sm text-[var(--muted)]">Verified cohort member</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {boundAskForDetails && !isOwn ? (
                      <AskForDetailsButton
                        action={boundAskForDetails.bind(null, review.user.id)}
                        reviewerName={getFounderDisplayName(review.user)}
                        vendorName={vendor.name}
                      />
                    ) : null}
                    <p className="rounded-full bg-[var(--panel-strong)] px-3 py-1 font-semibold" data-review-rating={review.rating}>
                      {review.rating}/5
                    </p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${qualityPct >= 80 ? "bg-green-100 text-green-800" : qualityPct >= 50 ? "bg-amber-100 text-amber-800" : "bg-[var(--panel-strong)] text-[var(--muted)]"}`}>
                      {qualityPct}%
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2" data-review-details="">
                  {review.usedVendor ? (
                    <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white" data-review-uservendor="true">
                      Used this vendor
                    </span>
                  ) : (
                    <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]" data-review-uservendor="false">
                      Recommendation only
                    </span>
                  )}
                  {review.workType ? (
                    <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]" data-review-worktype={review.workType}>
                      {review.workType}
                    </span>
                  ) : null}
                  {review.disclosedIncentive ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      Disclosure
                    </span>
                  ) : null}
                </div>
                {review.comment ? (
                  <p className="mt-4 leading-7 text-[var(--foreground)]">{review.comment}</p>
                ) : null}
                {review.images.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {review.images.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="h-24 w-24 rounded-xl border border-[var(--border)] object-cover transition hover:opacity-80"
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </div>
                ) : null}
                <p className="mt-4 text-sm text-[var(--muted)]" data-review-date={review.createdAt.toISOString()}>
                  {review.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                {upCount + downCount > 0 ? (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {upCount} helpful{downCount > 0 ? ` · ${downCount} not helpful` : ""}
                    {upCount + downCount > 0 ? ` (${Math.round((upCount / (upCount + downCount)) * 100)}% helpful)` : ""}
                  </p>
                ) : null}
                {founder && !isOwn ? (
                  <HelpfulVoteButton
                    reviewId={review.id}
                    userId={founder.id}
                    vendorId={vendor.id}
                    initialUp={upCount}
                    initialDown={downCount}
                    initialUserVote={userVote?.value ?? null}
                  />
                ) : null}
              </article>
              );
            })
          )}
        </div>

        <div className="mt-12 space-y-4">
          <h2 className="text-2xl font-semibold">Consumer reviews</h2>
          {consumerReviews.length === 0 ? (
            <p className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 text-[var(--muted)]">
              No consumer reviews yet.
            </p>
          ) : (
            consumerReviews.map((review) => (
              <article
                key={review.id}
                className="rounded-3xl border border-[var(--border)] bg-white/70 p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold" data-review-author={review.displayName ?? "Anonymous"}>{review.displayName ?? "Anonymous"}</p>
                  <p className="rounded-full bg-[var(--panel-strong)] px-3 py-1 font-semibold" data-review-rating={review.rating}>
                    {review.rating}/5
                  </p>
                </div>
                {review.comment ? (
                  <p className="mt-4 leading-7 text-[var(--foreground)]">{review.comment}</p>
                ) : null}
                {review.images?.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {review.images.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="h-24 w-24 rounded-xl border border-[var(--border)] object-cover transition hover:opacity-80"
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </div>
                ) : null}
                <p className="mt-4 text-sm text-[var(--muted)]" data-review-date={review.createdAt.toISOString()}>
                  {review.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </article>
            ))
          )}
        </div>

        {similarVendors.length > 0 ? (
          <div className="mt-12 space-y-4">
            <h2 className="text-2xl font-semibold">Similar vendors in other cohorts</h2>
            <div className="space-y-3">
              {similarVendors.map((v) => (
                <Link
                  key={v.id}
                  href={`/vendors/${v.id}`}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white/70 p-4 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{v.name}</p>
                      <span className="rounded-full bg-[var(--panel-strong)] px-2 py-0.5 text-xs text-[var(--muted)]">
                        {v.cohortName}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--muted)]">{v.category}</p>
                  </div>
                  <div className="flex gap-4 text-sm text-[var(--muted)]">
                    <span>{v.reviewCount} review{v.reviewCount === 1 ? "" : "s"}</span>
                    <span className="font-semibold text-[var(--foreground)]">{v.avgRating.toFixed(1)}/5</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="mb-3 flex gap-2">
            <a
              href={`/vendors/${vendor.id}?mode=founder`}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${reviewMode === "founder" ? "bg-[var(--accent)] text-white" : "bg-[var(--panel-strong)] text-[var(--muted)] hover:bg-[var(--panel-strong)]"}`}
            >
              Founder review
            </a>
            <a
              href={`/vendors/${vendor.id}?mode=consumer`}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${reviewMode === "consumer" ? "bg-[var(--accent)] text-white" : "bg-[var(--panel-strong)] text-[var(--muted)] hover:bg-[var(--panel-strong)]"}`}
            >
              Quick review
            </a>
          </div>
          {reviewMode === "founder" && action ? (
            <ReviewForm action={action} mode="founder" />
          ) : (
            <>
              <ReviewForm action={consumerAction} mode="consumer" />
              <details className="mt-4 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-4">
                <summary className="cursor-pointer text-sm font-semibold text-[var(--muted)]">
                  One-click rating
                </summary>
                <div className="mt-3">
                  <QuickReviewForm action={consumerAction} />
                </div>
              </details>
            </>
          )}
        </aside>
      </div>
      {/* JSON-LD for structured data - only for public consumer reviews */}
      {jsonLD && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLD) }}
        />
      )}
    </AppShell>
  );
}
