"use client";

import { useActionState } from "react";
import {
  fulfillVendorRequestAction,
  type FulfillRequestActionState,
} from "./actions";

type FulfillRequestFormProps = {
  requestId: string;
};

const initialState: FulfillRequestActionState = {};

export function FulfillRequestForm({ requestId }: FulfillRequestFormProps) {
  const action = fulfillVendorRequestAction.bind(null, requestId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <input
        name="vendorName"
        required
        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        placeholder="Vendor name"
      />
      <input
        name="vendorContact"
        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        placeholder="Contact email or URL"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add vendor"}
      </button>
      {state.error ? (
        <p className="text-sm font-medium text-red-700 sm:col-span-3">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm font-medium text-[var(--accent)] sm:col-span-3">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
