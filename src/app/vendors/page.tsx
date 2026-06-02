import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { searchVendorsForCohort, listVendorCategoriesForCohort, getCrossCohortRecommendations } from "@/lib/vendors";
import { getAverageRating, getVendorAuthorityScore, formatVendorAuthorityScore } from "@/lib/vendors";
import { formatAverageRating, reviewCountLabel } from "@/lib/vendor-presenter";
import { VendorSearch } from "./vendor-search";

type Props = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    sort?: "name" | "rating" | "trending" | "reviews";
  }>;
};

export default async function VendorsPage({ searchParams }: Props) {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    redirect("/");
  }

  const params = await searchParams;
  const query = params?.q ?? "";
  const category = params?.category;
  const sort = params?.sort ?? "name";

  const [vendors, categories, crossCohort] = await Promise.all([
    searchVendorsForCohort({
      cohortId: founder.cohortId,
      query: query || undefined,
      category,
      sort,
    }),
    listVendorCategoriesForCohort(founder.cohortId),
    getCrossCohortRecommendations(founder.cohortId),
  ]);

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Vendor directory
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          {query
            ? `Search results for "${query}"`
            : `Browse ${vendors.length} trusted vendors`}
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Named reviews from verified cohort founders. Filter by category, search
          by name, or sort by rating.
        </p>
        <Link
          href="/top-vendors"
          className="mt-4 inline-flex rounded-full bg-[var(--accent)] px-5 py-2 font-semibold text-white"
        >
          See vendor rankings
        </Link>
      </section>

      <VendorSearch
        query={query}
        selectedCategory={category}
        selectedSort={sort}
        categories={categories}
      />

      <section className="grid gap-4 md:grid-cols-2">
        {vendors.map((vendor) => {
          const averageRating = getAverageRating(vendor.reviews);
          const authority = formatVendorAuthorityScore(getVendorAuthorityScore(vendor.reviews));
          const tierStyles: Record<string, string> = {
            platinum: "bg-amber-100 text-amber-800 border-amber-200",
            gold: "bg-blue-50 text-blue-700 border-blue-200",
            silver: "bg-gray-50 text-gray-600 border-gray-200",
            bronze: "bg-orange-50 text-orange-700 border-orange-200",
            none: "bg-[var(--panel-strong)] text-[var(--muted)] border-transparent",
          };
          return (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.id}`}
              className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                    {vendor.category}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold">{vendor.name}</h2>
                </div>
                <div className="rounded-2xl bg-[var(--panel-strong)] px-3 py-2 text-right">
                  <p className="text-sm text-[var(--muted)]">Rating</p>
                  <p className="font-semibold">
                    {formatAverageRating(averageRating)}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2">
                {authority.tier !== "none" && (
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tierStyles[authority.tier]}`}>
                    {authority.label}
                  </span>
                )}
                <p className="text-sm text-[var(--muted)]">
                  {reviewCountLabel(vendor.reviews.length)}
                </p>
              </div>
            </Link>
          );
        })}
        {vendors.length === 0 ? (
          <div className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 md:col-span-2">
            <p className="text-xl font-semibold">No vendors found.</p>
            <p className="mt-2 leading-7 text-[var(--muted)]">
              {query
                ? `No vendors match "${query}". Try a different search term.`
                : "No vendors in this category yet."}
            </p>
          </div>
        ) : null}
      </section>

      {crossCohort.length > 0 && !query && !category ? (
        <section className="mt-10 rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Also trusted by other cohorts</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Highly rated vendors from other incubator cohorts.
          </p>
          <div className="mt-4 space-y-3">
            {crossCohort.map((vendor) => (
              <Link
                key={vendor.id}
                href={`/vendors/${vendor.id}`}
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 transition hover:-translate-y-0.5 hover:bg-white"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{vendor.name}</p>
                    <span className="rounded-full bg-[var(--panel-strong)] px-2 py-0.5 text-xs text-[var(--muted)]">
                      {vendor.cohortName}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{vendor.category}</p>
                </div>
                <div className="flex gap-4 text-sm text-[var(--muted)]">
                  <span>{vendor.reviewCount} review{vendor.reviewCount === 1 ? "" : "s"}</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {vendor.avgRating.toFixed(1)}/5
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
