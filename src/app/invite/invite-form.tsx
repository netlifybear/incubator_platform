"use client";

import { useActionState, useState } from "react";
import { createFounderInviteAction } from "./actions";

export function FounderInviteForm() {
  const [state, formAction, isPending] = useActionState(createFounderInviteAction, { error: undefined, success: undefined });
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  if (state?.invitePath) {
    const fullUrl = `${baseUrl}${state.invitePath}`;

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <p className="font-semibold text-green-800">{state.success}</p>
          <p className="mt-2 break-all text-sm text-green-700">{fullUrl}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(fullUrl).catch(() => {});
            setCopied(true);
          }}
          className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          {copied ? "Copied!" : "Copy invite link"}
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Founder email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="founder@example.com"
          className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Create invite"}
      </button>
      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}
