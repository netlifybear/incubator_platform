import Link from "next/link";
import type { Metadata } from "next";
import { listPublicCohorts } from "@/lib/cohorts";

const PRIVACY_THRESHOLD_FOUNDERS = 2;

export const metadata: Metadata = {
  title: "Cohorts — Incubator Trust",
  description: "Browse incubator cohorts and their aggregate trust metrics across vendors and reviews.",
};

export default async function CohortsPage() {
  const cohorts = await listPublicCohorts();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <section className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Cohorts</h1>
        <p className="mt-4 text-lg leading-7 text-[var(--muted)]">
          Incubator cohorts with verified vendor reviews and portable credibility.
        </p>
      </section>

      <section className="mt-10">
        <p className="mb-4 text-sm text-[var(--muted)]">{cohorts.length} cohort{cohorts.length === 1 ? "" : "s"}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cohorts.map((cohort) => (
            <Link
              key={cohort.id}
              href={`/cohorts/${cohort.slug}`}
              className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
            >
              <h2 className="font-semibold">{cohort.name}</h2>
              {cohort.description ? (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                  {cohort.description}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {cohort._count.users >= PRIVACY_THRESHOLD_FOUNDERS ? (
                  <>
                    <span className="rounded-full bg-[var(--panel-strong)] px-2.5 py-1 font-medium">
                      {cohort._count.users} founder{cohort._count.users === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-[var(--panel-strong)] px-2.5 py-1 font-medium">
                      {cohort._count.vendors} vendor{cohort._count.vendors === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-[var(--panel-strong)] px-2.5 py-1 font-medium">
                      {cohort._count.reviews + cohort._count.consumerReviews} review{(cohort._count.reviews + cohort._count.consumerReviews) === 1 ? "" : "s"}
                    </span>
                  </>
                ) : (
                  <span className="rounded-full bg-[var(--panel-strong)] px-2.5 py-1 font-medium text-[var(--muted)]">
                    New cohort
                  </span>
                )}
              </div>
            </Link>
          ))}
          {cohorts.length === 0 ? (
            <p className="col-span-full text-center text-[var(--muted)]">
              No cohorts yet.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
