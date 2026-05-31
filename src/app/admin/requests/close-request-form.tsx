"use client";

import { useActionState } from "react";
import { closeVendorRequestAction, type CloseRequestActionState } from "./actions";

type CloseRequestFormProps = {
  requestId: string;
};

const initialState: CloseRequestActionState = {};

export function CloseRequestForm({ requestId }: CloseRequestFormProps) {
  const action = closeVendorRequestAction.bind(null, requestId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-[1fr_auto]"
    >
      <input
        name="adminNote"
        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        placeholder="Optional close note, e.g. duplicate or needs more detail"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-[var(--border)] bg-white/70 px-5 py-3 font-semibold text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Closing..." : "Close request"}
      </button>
      {state.error ? (
        <p className="text-sm font-medium text-red-700 sm:col-span-2">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm font-medium text-[var(--accent)] sm:col-span-2">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
