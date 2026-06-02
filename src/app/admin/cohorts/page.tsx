import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { AdminCreateCohortForm } from "./create-cohort-form";
import { CohortTrustPolicyForm } from "./trust-policy-form";

export default async function AdminCohortsPage() {
  const admin = await getCurrentAdmin();
  if (!admin?.cohortId) {
    return null;
  }

  const cohorts = await prisma.cohort.findMany({
    where: { id: admin.cohortId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, vendors: true } } },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Cohorts
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Manage cohorts
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Cohorts group founders together. Each cohort has its own vendor directory and sprint cycle.
        </p>
      </section>

      <details className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--accent)]">
          Create new cohort
        </summary>
        <div className="mt-4">
          <AdminCreateCohortForm />
        </div>
      </details>

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Your cohort</h2>
        <div className="mt-4 space-y-3">
          {cohorts.map((cohort) => (
            <div
              key={cohort.id}
              className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
            >
              <div>
                <p className="font-semibold">{cohort.name}</p>
                <p className="text-sm text-[var(--muted)]">/{cohort.slug}</p>
                {cohort.description ? (
                  <p className="mt-1 text-sm text-[var(--muted)]">{cohort.description}</p>
                ) : null}
                <div className="mt-2">
                  <CohortTrustPolicyForm
                    cohortId={cohort.id}
                    currentPolicy={cohort.defaultTrustPolicy}
                  />
                </div>
              </div>
              <div className="flex gap-4 text-sm text-[var(--muted)]">
                <span>{cohort._count.users} founders</span>
                <span>{cohort._count.vendors} vendors</span>
              </div>
            </div>
          ))}
          {cohorts.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No cohorts yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
