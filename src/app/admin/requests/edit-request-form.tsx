"use client";

import { useActionState } from "react";
import { editVendorRequestAction, type EditRequestActionState } from "./actions";

type EditRequestFormProps = {
  category: string;
  description: string;
  requestId: string;
};

const initialState: EditRequestActionState = {};

export function EditRequestForm({
  category,
  description,
  requestId,
}: EditRequestFormProps) {
  const action = editVendorRequestAction.bind(null, requestId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
        Edit request
      </p>
      <div className="grid gap-3 sm:grid-cols-[14rem_1fr_auto]">
        <input
          name="category"
          required
          defaultValue={category}
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          placeholder="Category"
        />
        <input
          name="description"
          required
          defaultValue={description}
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          placeholder="Request description"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-[var(--border)] bg-white/70 px-5 py-3 font-semibold text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save edits"}
        </button>
      </div>
      {state.error ? <p className="text-sm font-medium text-red-700">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm font-medium text-[var(--accent)]">{state.success}</p>
      ) : null}
    </form>
  );
}
