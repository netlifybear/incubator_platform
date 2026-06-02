"use client";

import { useActionState } from "react";
import { updateCohortTrustPolicyAction } from "../actions";

const POLICY_OPTIONS = [
  { value: "all", label: "All data" },
  { value: "badges_only", label: "Badges only" },
  { value: "points_only", label: "Points only" },
] as const;

export function CohortTrustPolicyForm({
  cohortId,
  currentPolicy,
}: {
  cohortId: string;
  currentPolicy: string;
}) {
  const [state, formAction, pending] = useActionState(updateCohortTrustPolicyAction, {});

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="cohortId" value={cohortId} />
      <select
        name="defaultTrustPolicy"
        defaultValue={currentPolicy}
        className="rounded-xl border border-[var(--border)] bg-white px-3 py-1.5 text-xs"
      >
        {POLICY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save"}
      </button>
      {state.success ? (
        <span className="text-xs text-green-700">{state.success}</span>
      ) : state.error ? (
        <span className="text-xs text-red-600">{state.error}</span>
      ) : null}
    </form>
  );
}
