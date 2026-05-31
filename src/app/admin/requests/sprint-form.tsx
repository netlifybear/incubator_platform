"use client";

import { useActionState } from "react";
import { createSprintAction } from "./sprint-actions";

export function AdminCreateSprintForm() {
  const [state, action, pending] = useActionState(createSprintAction, {});

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Description (optional)</label>
        <textarea
          name="description"
          rows={2}
          className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">Goal (reviews)</label>
          <input
            name="goalReviewCount"
            type="number"
            min={1}
            defaultValue={3}
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Start date</label>
          <input
            name="startsAt"
            type="date"
            required
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">End date</label>
          <input
            name="endsAt"
            type="date"
            required
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
          />
        </div>
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
        {pending ? "Creating..." : "Create sprint"}
      </button>
    </form>
  );
}
