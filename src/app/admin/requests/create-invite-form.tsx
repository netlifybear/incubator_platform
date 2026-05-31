"use client";

import { useState, useCallback, useActionState } from "react";
import { createInviteAction, type CreateInviteActionState } from "./actions";

const initialState: CreateInviteActionState = {};

export function CreateInviteForm() {
  const [state, formAction, pending] = useActionState(
    createInviteAction,
    initialState,
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!state.invitePath) return;
    const url = `${window.location.origin}${state.invitePath}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available
    }
  }, [state.invitePath]);

  return (
    <form action={formAction} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
      <input
        name="email"
        required
        type="email"
        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        placeholder="founder@example.com"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating..." : "Create invite"}
      </button>
      {state.error ? (
        <p className="text-sm font-medium text-red-700 sm:col-span-2">{state.error}</p>
      ) : null}
      {state.success && state.invitePath ? (
        <div className="rounded-2xl bg-[var(--panel-strong)] p-4 text-sm sm:col-span-2">
          <p className="font-semibold text-[var(--accent-strong)]">{state.success}</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="break-all rounded-lg bg-white/70 px-3 py-2 font-mono text-xs">
              {state.invitePath}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold transition hover:bg-white"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
