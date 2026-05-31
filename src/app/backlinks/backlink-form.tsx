"use client";

import { useActionState } from "react";
import { addBacklinkAction, type BacklinkActionState } from "./actions";

const initialState: BacklinkActionState = {};

export function BacklinkForm() {
  const [state, formAction, pending] = useActionState(
    addBacklinkAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold">Add a referring domain</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Enter the domain that references your startup. Example:{" "}
        <span className="font-mono text-xs">example.com</span>
      </p>

      <div className="mt-5 flex items-end gap-3">
        <div className="flex-1">
          <label
            className="block text-sm font-semibold"
            htmlFor="referring-domain"
          >
            Domain
          </label>
          <input
            id="referring-domain"
            name="referringDomain"
            required
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            placeholder="example.com"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Adding..." : "Add domain"}
        </button>
      </div>

      {state.error ? (
        <p className="mt-4 text-sm font-medium text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="mt-4 text-sm font-medium text-[var(--accent)]">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
