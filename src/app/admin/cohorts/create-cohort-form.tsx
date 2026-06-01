"use client";

import { useActionState } from "react";
import { createCohortAction } from "../actions";

export function AdminCreateCohortForm() {
  const [state, formAction, pending] = useActionState(createCohortAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold" htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          required
          className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          placeholder="e.g., Summer 2026 Incubator"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold" htmlFor="slug">Slug</label>
        <input
          id="slug"
          name="slug"
          required
          className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono"
          placeholder="e.g., summer-2026"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold" htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={2}
          className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        />
      </div>
      {state.error ? <p className="text-sm font-medium text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-green-700">{state.success}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create cohort"}
      </button>
    </form>
  );
}
