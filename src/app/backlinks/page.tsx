import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { listBacklinksForFounder, getBacklinkSnapshots } from "@/lib/backlinks";
import { analyzeBacklinks } from "@/lib/backlink-analysis";
import { BacklinkForm } from "./backlink-form";
import { BacklinkList } from "./backlink-list";
import { GscSection } from "./gsc-section";
import { BacklinkAnalysisPanel } from "@/app/components/backlink-analysis-panel";
import { BacklinkVelocityChart } from "@/app/components/backlink-velocity-chart";

export default async function BacklinksPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  const backlinks = await listBacklinksForFounder(founder.id);
  const analysis = analyzeBacklinks(backlinks);
  const snapshots = await getBacklinkSnapshots(founder.id);

  return (
    <AppShell founder={founder} cohortName={founder.cohort?.name ?? undefined}>
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Backlink tracker
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Monitor where your startup is mentioned online.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Manually track domains that link to your startup, or import data from
          Google Search Console to auto-discover referring domains.
        </p>
      </section>

      <BacklinkVelocityChart snapshots={snapshots} />

      <GscSection
        gscConnected={!!founder.gscAccessToken}
        gscEmail={founder.gscEmail}
      />

      <BacklinkAnalysisPanel analysis={analysis} />

      <BacklinkForm />

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Tracked domains</h2>
        {backlinks.length === 0 ? (
          <p className="mt-4 text-[var(--muted)]">
            No domains tracked yet. Add your first referring domain above.
          </p>
        ) : (
          <BacklinkList backlinks={backlinks} />
        )}
      </section>
    </AppShell>
  );
}
