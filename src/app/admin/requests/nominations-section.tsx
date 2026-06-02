import { listPendingNominations } from "@/lib/nominations";
import { badgeDefinition } from "@/config/badge-definitions";
import {
  ApproveForm,
  RejectForm,
  ApproveWithNoteForm,
  RejectWithNoteForm,
} from "./nomination-actions-client";

export async function AdminNominationsSection({
  cohortId,
}: {
  cohortId: string;
}) {
  const pending = await listPendingNominations(cohortId);

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Peer nominations
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {pending.length} pending
          </h2>
          <p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">
            Founders nominate each other for contribution tags. Review and approve or reject.
          </p>
        </div>
      </div>

      {pending.length === 0 ? (
        <p className="mt-5 text-[var(--muted)]">No pending nominations.</p>
      ) : (
        <div className="mt-5 space-y-4">
          {pending.map((n) => {
            const def = badgeDefinition(n.tagType);
            return (
              <div
                key={n.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {def?.icon} {def?.label ?? n.tagType}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {n.nominator.name ?? n.nominator.email} nominated{" "}
                      {n.nominee.name ?? n.nominee.email}
                    </p>
                    <p className="mt-2 text-sm leading-6">{n.reason}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <ApproveForm nominationId={n.id} />
                    <RejectForm nominationId={n.id} />
                  </div>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-[var(--muted)] hover:text-[var(--accent)]">
                    Add admin note
                  </summary>
                  <div className="mt-2">
                    <div className="flex gap-2">
                      <ApproveWithNoteForm nominationId={n.id} />
                      <RejectWithNoteForm nominationId={n.id} />
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      The note is visible to the nominator and nominee.
                    </p>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function NominationsFallback() {
  return (
    <section className="animate-pulse rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="h-4 w-32 rounded-full bg-[var(--panel-strong)]" />
      <div className="mt-3 h-7 w-40 rounded-full bg-[var(--panel-strong)]" />
      <div className="mt-5 h-24 rounded-2xl bg-[var(--panel-strong)]" />
    </section>
  );
}
