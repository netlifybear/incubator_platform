import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { ProfileSettingsForm } from "./settings-form";
import { updateProfileAction } from "./actions";
import { ReputationPortability } from "@/app/components/reputation-portability";
import { QualityDashboard } from "@/app/components/quality-dashboard";

export default async function ProfileSettingsPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    redirect("/");
  }

  const action = updateProfileAction.bind(null);

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Settings
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Edit your founder profile.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Your public profile is visible to anyone who finds your founder page.
          Private reviews and cohort activity never appear publicly.
        </p>
      </section>

      <ProfileSettingsForm
        action={action}
        founder={{
          name: founder.name,
          bio: founder.bio,
          startupUrl: founder.startupUrl,
          startupName: founder.startupName,
          profileSlug: founder.profileSlug,
          publicProfileEnabled: founder.publicProfileEnabled,
          profileCompletePercentage: founder.profileCompletePercentage,
        }}
        cohortName={founder.cohort.name}
      />

      <Suspense fallback={<div className="h-32 animate-pulse rounded-3xl bg-[var(--panel-strong)]" />}>
        <QualityDashboard userId={founder.id} />
      </Suspense>

      <ReputationPortability />
    </AppShell>
  );
}
