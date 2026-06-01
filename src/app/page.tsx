import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { VendorRequestForm } from "@/app/components/vendor-request-form";
import { getCurrentFounder } from "@/lib/auth";
import { getFounderDisplayName, hasActiveCohort } from "@/lib/tenant-policy";
import { requestCountLabel, requestStatusLabel } from "@/lib/vendor-request-presenter";
import { listOpenVendorRequestsForCohort } from "@/lib/vendor-requests";
import { formatAverageRating, reviewCountLabel } from "@/lib/vendor-presenter";
import {
  getAverageRating,
  listVendorCategoriesForCohort,
  listVendorsForCohort,
} from "@/lib/vendors";
import { OnboardingBanner } from "@/app/components/onboarding-banner";
import { VendorSearch } from "@/app/components/vendor-search";
import { prisma } from "@/lib/prisma";
import { getActiveSprint } from "@/lib/sprints";
import { computeReviewStreak } from "@/lib/rewards";
import { searchVendorsForCohort } from "@/lib/vendors";

type HomeProps = {
  searchParams?: Promise<{
    category?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    return (
      <AppShell founder={founder}>
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Cohort needed
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            You are signed in, but not attached to an incubator cohort yet.
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
            Ask an incubator admin for an invite before browsing private vendor
            recommendations. The trust layer only works when membership is explicit.
          </p>
        </section>
      </AppShell>
    );
  }

  const cohortId = founder.cohortId;
  const params = await searchParams as { category?: string; q?: string } | undefined;
  const selectedCategory = params?.category;
  const searchQuery = params?.q;
  const [vendors, categories, openRequests, reviewCount, badgeCount, activeSprint] = await Promise.all([
    searchQuery
      ? searchVendorsForCohort({ cohortId, query: searchQuery, category: selectedCategory, sort: "reviews" })
      : listVendorsForCohort(cohortId, selectedCategory),
    listVendorCategoriesForCohort(cohortId),
    listOpenVendorRequestsForCohort(cohortId),
    prisma.review.count({ where: { userId: founder.id } }),
    prisma.badge.count({ where: { userId: founder.id } }),
    getActiveSprint(cohortId),
  ]);
  const totalReviewCount = vendors.reduce(
    (sum, vendor) => sum + vendor.reviews.length,
    0,
  );
  const metrics = [
    { label: "Trusted vendors", value: vendors.length },
    { label: "Cohort reviews", value: totalReviewCount },
    { label: "Open requests", value: openRequests.length },
    { label: "Your badges", value: badgeCount },
  ];

  const streak = computeReviewStreak(founder.lastReviewDate);
  const mySprintProgress = activeSprint
    ? activeSprint.contributors.find((c) => c.userId === founder.id)
    : null;

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <div className="space-y-8">
        <section className="grid gap-4">
          <div className="flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow-ambient)] lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                {founder.cohort.name}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-normal">
                Write
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                Review vendors your cohort trusts. Your contributions build private
                reputation and public credibility.
              </p>
              {activeSprint && mySprintProgress ? (
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span className="rounded-xl bg-[var(--accent)]/10 px-3 py-1.5 font-medium text-[var(--accent)]">
                    Sprint: {mySprintProgress.reviewCount} / {activeSprint.goalReviewCount} reviews
                  </span>
                </div>
              ) : null}
              {streak > 0 ? (
                <span className="mt-2 inline-block rounded-xl bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800">
                  {streak}-week streak
                </span>
              ) : null}
            </div>
            <Link
              href="/vendors"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)]"
            >
              Write a review
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-ambient)]"
              >
                <p className="text-sm text-[var(--muted)]">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
              </div>
            ))}
          </div>
        </section>

        <OnboardingBanner
          profileCompletePercentage={founder.profileCompletePercentage}
          reviewCount={reviewCount}
          badgeCount={badgeCount}
        />

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                  Vendor trust
                </p>
                <h2 className="mt-1 text-2xl font-semibold">Cohort vendor directory</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  Named reviews and ratings from founders in your verified cohort.
                </p>
              </div>
              <Link href="/top-vendors" className="text-sm font-semibold text-[var(--accent)]">
                View rankings
              </Link>
            </div>

            <div className="mt-5">
              <VendorSearch initialQuery={searchQuery ?? ""} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/"
                className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                  selectedCategory
                    ? "border-[var(--border)] bg-white"
                    : "border-[var(--accent)] bg-[var(--accent)] text-white"
                }`}
              >
                All vendors
              </Link>
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/?category=${encodeURIComponent(category)}`}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                    selectedCategory === category
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--border)] bg-white"
                  }`}
                >
                  {category}
                </Link>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {vendors.map((vendor) => {
                const averageRating = getAverageRating(vendor.reviews);

                return (
                  <Link
                    key={vendor.id}
                    href={`/vendors/${vendor.id}`}
                    className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-ambient)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                          {vendor.category}
                        </p>
                        <h3 className="mt-3 text-xl font-semibold">{vendor.name}</h3>
                      </div>
                      <div className="rounded-xl bg-[var(--panel-strong)] px-3 py-2 text-right">
                        <p className="text-xs text-[var(--muted)]">Rating</p>
                        <p className="font-semibold">{formatAverageRating(averageRating)}</p>
                      </div>
                    </div>
                    <p className="mt-5 text-sm text-[var(--muted)]">
                      {reviewCountLabel(vendor.reviews.length)}
                    </p>
                  </Link>
                );
              })}
              {vendors.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-white p-5 md:col-span-2">
                  <p className="text-xl font-semibold">No vendors found yet.</p>
                  <p className="mt-2 leading-7 text-[var(--muted)]">
                    Try a different category, or add the first trusted vendor for this
                    cohort before inviting founders in.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-ambient)]">
              <p className="text-sm text-[var(--muted)]">Signed in as</p>
              <p className="mt-1 text-xl font-semibold">{founder.name ?? founder.email}</p>
              <p className="mt-3 inline-flex rounded-xl bg-[var(--panel-strong)] px-3 py-2 text-sm font-medium text-[var(--accent-strong)]">
                Verified cohort member
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-ambient)]">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                Reputation
              </p>
              <h2 className="mt-2 text-xl font-semibold">Build portable trust</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Reviews, badges, nominations, and helpful votes feed your cohort
                reputation.
              </p>
              <div className="mt-4 grid gap-2">
                <Link
                  href="/leaderboard"
                  className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Leaderboard
                </Link>
                <Link
                  href="/rewards"
                  className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Rewards
                </Link>
                <Link
                  href="/profile/settings"
                  className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Profile settings
                </Link>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <VendorRequestForm />
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-ambient)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                  Cohort demand
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Open recommendation requests</h2>
              </div>
              <span className="rounded-xl bg-[var(--panel-strong)] px-3 py-2 text-sm font-semibold">
                {requestCountLabel(openRequests.length)}
              </span>
            </div>
            <div className="mt-5 divide-y divide-[var(--border)]">
              {openRequests.length === 0 ? (
                <p className="leading-7 text-[var(--muted)]">
                  No open requests yet. When founders need a vendor that is not listed,
                  their requests will show up here.
                </p>
              ) : (
                openRequests.map((request) => (
                  <article key={request.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold">{request.category}</p>
                      <span className="rounded-xl bg-[var(--panel-strong)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                        {requestStatusLabel(request.status)}
                      </span>
                    </div>
                    <p className="mt-3 leading-7 text-[var(--foreground)]">
                      {request.description}
                    </p>
                    <p className="mt-3 text-sm text-[var(--muted)]">
                      Requested by {getFounderDisplayName(request.user)} on{" "}
                      {request.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
