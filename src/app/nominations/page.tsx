import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { listNominationsForFounder } from "@/lib/nominations";
import { NominationForm } from "./nomination-form";
import { NominationList } from "./nomination-list";

export default async function NominationsPage() {
  const founder = await getCurrentFounder();

  if (!founder?.cohortId) {
    redirect("/signin");
  }

  const nominations = await listNominationsForFounder(founder.id);

  const madeByMe = nominations.filter((n) => n.nominator.id === founder.id);
  const receivedByMe = nominations.filter((n) => n.nominee.id === founder.id);

  return (
    <AppShell founder={founder} cohortName={founder.cohort?.name ?? undefined}>
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Peer nominations
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Recognize outstanding founders.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Nominate a fellow founder for a badge. An admin reviews each nomination
          before the badge is awarded.
        </p>
      </section>

      <NominationForm />

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Nominations I made</h2>
        <NominationList
          nominations={madeByMe}
          emptyMessage="You haven't nominated anyone yet."
        />
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Nominations I received</h2>
        <NominationList
          nominations={receivedByMe}
          emptyMessage="No one has nominated you yet."
        />
      </section>
    </AppShell>
  );
}
