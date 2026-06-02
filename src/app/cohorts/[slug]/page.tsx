import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicCohortBySlug } from "@/lib/cohorts";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cohort = await getPublicCohortBySlug(slug);
  if (!cohort) return { title: "Cohort not found" };

  return {
    title: `${cohort.name} — Incubator Trust`,
    description:
      cohort.description ??
      `${cohort.name} incubator cohort with ${cohort._count.users} founders and ${cohort._count.vendors} vendors.`,
  };
}

export default async function CohortPage({ params }: Props) {
  const { slug } = await params;
  const cohort = await getPublicCohortBySlug(slug);
  if (!cohort) notFound();

  const totalReviews = cohort._count.reviews + cohort._count.consumerReviews;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link href="/cohorts" className="text-sm font-semibold text-[var(--accent)]">
        Back to cohorts
      </Link>

      <section className="mt-6">
        <h1 className="text-4xl font-semibold tracking-tight">{cohort.name}</h1>
        {cohort.description ? (
          <p className="mt-4 max-w-2xl text-lg leading-7 text-[var(--muted)]">
            {cohort.description}
          </p>
        ) : null}
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Founders
          </p>
          <p className="mt-2 text-3xl font-semibold">{cohort._count.users}</p>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Vendors
          </p>
          <p className="mt-2 text-3xl font-semibold">{cohort._count.vendors}</p>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Founder reviews
          </p>
          <p className="mt-2 text-3xl font-semibold">{cohort._count.reviews}</p>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Consumer reviews
          </p>
          <p className="mt-2 text-3xl font-semibold">{cohort._count.consumerReviews}</p>
        </div>
      </section>

      {cohort._count.sprints > 0 ? (
        <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6">
          <p className="text-sm font-semibold text-[var(--accent)]">
            {cohort._count.sprints} active sprint{cohort._count.sprints === 1 ? "" : "s"}
          </p>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Top vendors</h2>
        {cohort.topVendors.length === 0 ? (
          <p className="mt-4 text-[var(--muted)]">No vendors registered yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {cohort.topVendors.map((vendor) => (
              <Link
                key={vendor.id}
                href={`/vendors/${vendor.id}`}
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white/70 p-4 transition hover:-translate-y-0.5 hover:bg-white"
              >
                <div>
                  <p className="font-semibold">{vendor.name}</p>
                  <p className="text-sm text-[var(--muted)]">{vendor.category}</p>
                </div>
                <div className="flex gap-4 text-sm text-[var(--muted)]">
                  <span>{vendor.reviewCount} review{vendor.reviewCount === 1 ? "" : "s"}</span>
                  {vendor.avgRating !== null ? (
                    <span className="font-semibold text-[var(--foreground)]">
                      {vendor.avgRating.toFixed(1)}/5
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 text-center">
        <p className="mb-2 text-sm text-[var(--muted)]">
          {cohort._count.users} verified founder{cohort._count.users === 1 ? "" : "s"} across {totalReviews} review{totalReviews === 1 ? "" : "s"}.
        </p>
      </section>
    </div>
  );
}
