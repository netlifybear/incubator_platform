import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentAdmin } from "@/lib/auth";
import { AdminMetricsSection, MetricsFallback } from "./metrics-section";
import { AdminInvitesSection, InvitesFallback } from "./invites-section";
import {
  AdminOpenRequestsSection,
  AdminFulfilledRequestsSection,
  AdminClosedRequestsSection,
} from "./requests-section";
import { AdminBadgesSection, BadgesFallback } from "./badges-section";
import { AdminFlywheelSection, FlywheelFallback } from "./flywheel-section";
import {
  AdminNominationsSection,
  NominationsFallback,
} from "./nominations-section";
import {
  AdminFoundersBadgesSection,
  FoundersBadgesFallback,
} from "./founders-section";
import { AdminSprintsSection } from "./sprints-section";
import { AdminDigestSection } from "./digest-section";
import {
  AdminBadgeAttemptsSection,
  BadgeAttemptsFallback,
} from "./badge-attempts-section";

function RequestsFallback() {
  return (
    <section className="animate-pulse rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="h-7 w-40 rounded-full bg-[var(--panel-strong)]" />
      <div className="mt-6 h-20 rounded-2xl bg-[var(--panel-strong)]" />
    </section>
  );
}

export default async function AdminRequestsPage() {
  const admin = await getCurrentAdmin();

  if (!admin?.cohortId || !admin.cohort) {
    notFound();
  }

  return (
    <AppShell founder={admin} cohortName={admin.cohort.name}>
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Admin
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Convert founder requests into vendors.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Use this queue to close the loop: founders ask for help, admins add a
          useful vendor, and the private directory becomes more complete.
        </p>
      </section>

      <Suspense fallback={<MetricsFallback />}>
        <AdminMetricsSection cohortId={admin.cohortId} />
      </Suspense>

      <Suspense fallback={<FlywheelFallback />}>
        <AdminFlywheelSection cohortId={admin.cohortId} />
      </Suspense>

      <Suspense fallback={<InvitesFallback />}>
        <AdminInvitesSection cohortId={admin.cohortId} />
      </Suspense>

      <Suspense fallback={<RequestsFallback />}>
        <AdminOpenRequestsSection cohortId={admin.cohortId} />
      </Suspense>

      <Suspense fallback={<RequestsFallback />}>
        <AdminFulfilledRequestsSection cohortId={admin.cohortId} />
      </Suspense>

      <Suspense fallback={<RequestsFallback />}>
        <AdminClosedRequestsSection cohortId={admin.cohortId} />
      </Suspense>

      <Suspense fallback={<BadgesFallback />}>
        <AdminBadgesSection />
      </Suspense>

      <Suspense fallback={<NominationsFallback />}>
        <AdminNominationsSection cohortId={admin.cohortId} />
      </Suspense>

      <Suspense fallback={<FoundersBadgesFallback />}>
        <AdminFoundersBadgesSection cohortId={admin.cohortId} />
      </Suspense>

      <Suspense fallback={<BadgeAttemptsFallback />}>
        <AdminBadgeAttemptsSection />
      </Suspense>

      <Suspense fallback={<div className="h-24 animate-pulse rounded-3xl bg-[var(--panel-strong)]" />}>
        <AdminSprintsSection cohortId={admin.cohortId} />
      </Suspense>

      <AdminDigestSection />
    </AppShell>
  );
}
