"use client";

import { useActionState } from "react";
import {
  createVendorRequestAction,
  type VendorRequestActionState,
} from "@/app/actions/vendor-requests";

const initialState: VendorRequestActionState = {};

export function VendorRequestForm() {
  const [state, formAction, pending] = useActionState(
    createVendorRequestAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-ambient)]"
    >
      <h2 className="text-2xl font-semibold">Request a recommendation</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Missing a vendor? Ask the cohort. This captures demand before the directory
        is fully populated.
      </p>

      <label className="mt-6 block text-sm font-semibold" htmlFor="request-category">
        Category
      </label>
      <input
        id="request-category"
        name="category"
        required
        className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 focus:border-[var(--accent)]"
        placeholder="Legal, Accounting, Payroll, Design..."
      />

      <label className="mt-5 block text-sm font-semibold" htmlFor="request-description">
        What do you need?
      </label>
      <textarea
        id="request-description"
        name="description"
        required
        minLength={15}
        rows={4}
        className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 focus:border-[var(--accent)]"
        placeholder="Example: Need a startup lawyer for SAFE notes and Delaware setup."
      />

      {state.error ? <p className="mt-4 text-sm font-medium text-red-700">{state.error}</p> : null}
      {state.success ? (
        <p className="mt-4 text-sm font-medium text-[var(--accent)]">{state.success}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-xl bg-[var(--accent)] px-5 py-3 font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Posting request..." : "Post request"}
      </button>
    </form>
  );
}
