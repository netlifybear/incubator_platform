"use client";

import { useActionState } from "react";
import { createNominationAction, type NominationActionState } from "./actions";

const initialState: NominationActionState = {};

export function NominationForm() {
  const [state, formAction, pending] = useActionState(
    createNominationAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold">Nominate a peer for a contribution tag</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Recognize a fellow founder who has made meaningful contributions to the
        cohort.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold" htmlFor="nominee-email">
            Founder email
          </label>
          <input
            id="nominee-email"
            name="nomineeEmail"
            type="email"
            required
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            placeholder="founder@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="tag-type">
            Tag type
          </label>
          <select
            id="tag-type"
            name="tagType"
            required
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            <option value="community_contributor">Community Contributor</option>
            <option value="helpful_reviewer">Helpful Reviewer</option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label className="block text-sm font-semibold" htmlFor="nomination-reason">
          Why does this founder deserve this tag?
        </label>
        <textarea
          id="nomination-reason"
          name="reason"
          required
          minLength={20}
          rows={4}
          className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          placeholder="Describe their contribution — specific examples help the admin make a decision."
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit nomination"}
      </button>

      {state.error ? (
        <p className="mt-4 text-sm font-medium text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="mt-4 text-sm font-medium text-[var(--accent)]">{state.success}</p>
      ) : null}
    </form>
  );
}
