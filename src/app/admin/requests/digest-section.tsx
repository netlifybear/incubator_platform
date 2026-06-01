"use client";

import { useActionState } from "react";
import { sendDigestAction } from "./digest-actions";

export function AdminDigestSection() {
  const [state, formAction, pending] = useActionState(sendDigestAction, {
    error: undefined,
    sent: undefined,
  });

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Weekly digest
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Send digest emails</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Trigger a weekly digest email for all cohort founders. Shows profile views, reviews, backlinks, and suggested next steps.
          </p>
        </div>
        <form action={formAction}>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Sending..." : "Send digest now"}
          </button>
        </form>
      </div>
      {state.error ? (
        <p className="mt-4 text-sm font-medium text-red-600">{state.error}</p>
      ) : null}
      {state.sent !== undefined ? (
        <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          Digest sent to {state.sent} of {state.total} founders
        </p>
      ) : null}
    </section>
  );
}
