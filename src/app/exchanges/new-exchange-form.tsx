"use client";

import { useActionState } from "react";
import { createExchangeAction } from "./actions";

export function NewExchangeForm({
  founders,
}: {
  founders: Array<{ id: string; name: string | null; email: string }>;
}) {
  const [state, action, pending] = useActionState(createExchangeAction, {});

  return (
    <details className="group rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <summary className="cursor-pointer text-xl font-semibold transition marker:text-[var(--accent)]">
        Propose a guest post exchange
      </summary>
      <form action={action} className="mt-4 space-y-3">
        <div>
          <label className="block text-sm font-medium">Recipient</label>
          <select
            name="recipientId"
            required
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
          >
            <option value="">Select a founder...</option>
            {founders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name ?? f.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Topic</label>
          <input
            name="topic"
            required
            placeholder="e.g. How we scaled our onboarding"
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Message <span className="text-[var(--muted)]">(optional)</span>
          </label>
          <textarea
            name="message"
            rows={3}
            placeholder="Brief context about the proposed post..."
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        {state.success && (
          <p className="text-sm text-green-600">{state.success}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Sending..." : "Send request"}
        </button>
      </form>
    </details>
  );
}
