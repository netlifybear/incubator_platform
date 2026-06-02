"use client";

import { useActionState } from "react";
import { awardBadgeAction, type AwardBadgeActionState } from "./badge-actions";
import { listAwardableBadgeTypes } from "@/config/badge-definitions";

const initialState: AwardBadgeActionState = {};

export function AwardBadgeForm() {
  const [state, formAction, pending] = useActionState(awardBadgeAction, initialState);

  const awardableBadges = listAwardableBadgeTypes("admin");

  return (
    <form action={formAction} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          name="email"
          required
          type="email"
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          placeholder="founder@example.com"
        />
        <select
          name="badgeType"
          defaultValue="community_contributor"
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        >
          {awardableBadges.map((b) => (
            <option key={b.type} value={b.type}>
              {b.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Awarding..." : "Award tag"}
        </button>
      </div>
      <input
        name="description"
        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        placeholder="Optional reason for this tag"
      />
      {state.error ? (
        <p className="text-sm font-medium text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm font-medium text-[var(--accent)]">{state.success}</p>
      ) : null}
    </form>
  );
}
