import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { AdminMetricsSection, MetricsFallback } from "./requests/metrics-section";
import { AdminFlywheelSection, FlywheelFallback } from "./requests/flywheel-section";
import { AdminSprintsSection } from "./requests/sprints-section";
import { AdminDigestSection } from "./requests/digest-section";

export default async function AdminOverviewPage() {
  const admin = await getCurrentAdmin();

  if (!admin?.cohortId || !admin.cohort) {
    notFound();
  }

  return (
    <>
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Admin
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          {admin.cohort.name} Dashboard
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Monitor your cohort&apos;s trust flywheel, manage sprints, and send digests.
        </p>
      </section>

      <div className="mt-8 space-y-6">
        <Suspense fallback={<MetricsFallback />}>
          <AdminMetricsSection cohortId={admin.cohortId} />
        </Suspense>

        <Suspense fallback={<FlywheelFallback />}>
          <AdminFlywheelSection cohortId={admin.cohortId} />
        </Suspense>

        <Suspense fallback={<div className="h-24 animate-pulse rounded-3xl bg-[var(--panel-strong)]" />}>
          <AdminSprintsSection cohortId={admin.cohortId} />
        </Suspense>

        <AdminDigestSection />
      </div>
    </>
  );
}
