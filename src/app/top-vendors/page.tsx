import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { prisma } from "@/lib/prisma";
import { getAverageRating, getVendorAuthorityScore, formatVendorAuthorityScore } from "@/lib/vendors";
import { formatAverageRating, reviewCountLabel } from "@/lib/vendor-presenter";

export default async function TopVendorsPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    redirect("/");
  }

  const vendors = await prisma.vendor.findMany({
    where: { cohortId: founder.cohortId },
    include: {
      reviews: { select: { rating: true } },
    },
  });

  const ranked = vendors
    .map((v) => ({
      ...v,
      avgRating: getAverageRating(v.reviews),
      authorityScore: getVendorAuthorityScore(v.reviews),
      authorityTier: formatVendorAuthorityScore(getVendorAuthorityScore(v.reviews)),
    }))
    .sort((a, b) => b.authorityScore - a.authorityScore);

  const tierStyles: Record<string, string> = {
    platinum: "bg-amber-100 text-amber-800",
    gold: "bg-blue-50 text-blue-700",
    silver: "bg-gray-50 text-gray-600",
    bronze: "bg-orange-50 text-orange-700",
    none: "bg-[var(--panel-strong)] text-[var(--muted)]",
  };

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Vendor rankings
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Best vendors on merit
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Ranked by authority score — a weighted combination of average rating and review count.
          The more reviews, the more confident the score.
        </p>
      </section>

      <section className="space-y-3">
        {ranked.map((vendor, i) => (
          <Link
            key={vendor.id}
            href={`/vendors/${vendor.id}`}
            className="flex items-center gap-4 rounded-3xl border border-[var(--border)] bg-white/70 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--panel-strong)] text-lg font-bold text-[var(--accent)]">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                {vendor.category}
              </p>
              <h2 className="text-xl font-semibold">{vendor.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${tierStyles[vendor.authorityTier.tier]}`}>
                  {vendor.authorityTier.label}
                </span>
                <span className="text-sm text-[var(--muted)]">
                  {reviewCountLabel(vendor.reviews.length)}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm text-[var(--muted)]">Rating</p>
              <p className="text-lg font-semibold">
                {vendor.avgRating === null ? "—" : formatAverageRating(vendor.avgRating)}
              </p>
            </div>
          </Link>
        ))}
        {ranked.length === 0 && (
          <p className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 text-[var(--muted)]">
            No vendors in your cohort yet.
          </p>
        )}
      </section>

      <p className="text-sm text-[var(--muted)]">
        <Link href="/vendors" className="font-semibold text-[var(--accent)]">
          Browse full directory
        </Link>
      </p>
    </AppShell>
  );
}
