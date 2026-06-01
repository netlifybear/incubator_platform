import Link from "next/link";
import type { Metadata } from "next";
import { listPublicFounders } from "@/lib/founder-profiles";

export const metadata: Metadata = {
  title: "Founders — Incubator Trust",
  description: "Browse verified startup founders with public profiles across incubator cohorts.",
};

export default async function FoundersPage() {
  const founders = await listPublicFounders();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <section className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Browse founders</h1>
        <p className="mt-4 text-lg leading-7 text-[var(--muted)]">
          Verified startup founders building portable reputation across incubator cohorts.
        </p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {founders.length === 0 ? (
          <p className="col-span-full text-center text-[var(--muted)]">
            No public profiles yet.
          </p>
        ) : (
          founders.map((founder) => (
            <Link
              key={founder.profileSlug}
              href={`/founder/${founder.profileSlug}`}
              className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-lg font-semibold text-white">
                  {(founder.name ?? "F").charAt(0)}
                </div>
                <div>
                  <h2 className="font-semibold">{founder.name}</h2>
                  <p className="text-sm text-[var(--muted)]">{founder.cohort?.name ?? "Incubator cohort"}</p>
                </div>
              </div>
              {founder.bio ? (
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                  {founder.bio}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {founder.startupName ? (
                  <span className="rounded-full bg-[var(--panel-strong)] px-2.5 py-1 font-medium">
                    {founder.startupName}
                  </span>
                ) : null}
                <span className="rounded-full bg-[var(--panel-strong)] px-2.5 py-1 font-medium">
                  {founder._count.badges} badge{founder._count.badges === 1 ? "" : "s"}
                </span>
                <span className="rounded-full bg-[var(--panel-strong)] px-2.5 py-1 font-medium">
                  {founder.profileCompletePercentage}% complete
                </span>
              </div>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
