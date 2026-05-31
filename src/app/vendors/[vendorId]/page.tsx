import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { getFounderDisplayName } from "@/lib/tenant-policy";
import { formatAverageRating } from "@/lib/vendor-presenter";
import { getAverageRating, getVendorForCohort } from "@/lib/vendors";
import { createReviewAction } from "./actions";
import { ReviewForm } from "./review-form";
import { HelpfulVoteButton } from "@/app/components/helpful-vote-button";

type VendorPageProps = {
  params: Promise<{
    vendorId: string;
  }>;
};

export default async function VendorPage({ params }: VendorPageProps) {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!founder.cohortId || !founder.cohort) {
    notFound();
  }

  const { vendorId } = await params;
  const vendor = await getVendorForCohort(vendorId, founder.cohortId);

  if (!vendor) {
    notFound();
  }

  const averageRating = getAverageRating(vendor.reviews);
  const action = createReviewAction.bind(null, vendor.id);

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
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
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-semibold">Named founder reviews</h2>
          {vendor.reviews.length === 0 ? (
            <p className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 text-[var(--muted)]">
              No reviews yet. Be the first founder to leave useful context.
            </p>
          ) : (
            vendor.reviews.map((review) => {
              const upCount = review.helpfulVotes.filter((v) => v.value).length;
              const downCount = review.helpfulVotes.filter((v) => !v.value).length;
              const userVote = review.helpfulVotes.find(
                (v) => v.userId === founder.id,
              );
              const isOwn = review.user.id === founder.id;

              return (
              <article
                key={review.id}
                className="rounded-3xl border border-[var(--border)] bg-white/70 p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{getFounderDisplayName(review.user)}</p>
                    <p className="text-sm text-[var(--muted)]">Verified cohort member</p>
                  </div>
                  <p className="rounded-full bg-[var(--panel-strong)] px-3 py-1 font-semibold">
                    {review.rating}/5
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {review.usedVendor ? (
                    <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white">
                      Used this vendor
                    </span>
                  ) : (
                    <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                      Recommendation only
                    </span>
                  )}
                  {review.workType ? (
                    <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
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
                <p className="mt-4 text-sm text-[var(--muted)]">
                  {review.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                {!isOwn ? (
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
      </section>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <ReviewForm action={action} mode="founder" />
        </aside>
      </div>
    </AppShell>
  );
}
