"use client";

import { useActionState } from "react";
import type { ReviewActionState } from "../[vendorId]/actions";

type Props = {
  action: (state: ReviewActionState, formData: FormData) => Promise<ReviewActionState>;
};

const RATINGS = [
  { value: 5, label: "Excellent", emoji: "🌟" },
  { value: 4, label: "Strong", emoji: "👍" },
  { value: 3, label: "Mixed", emoji: "😐" },
  { value: 2, label: "Weak", emoji: "👎" },
  { value: 1, label: "Avoid", emoji: "🚫" },
];

export function QuickReviewForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, { error: undefined, success: undefined });

  if (state.success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50/70 p-4 text-center">
        <p className="font-semibold text-green-700">Review saved!</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="comment" value="" />
      <input type="hidden" name="usedVendor" value="" />
      <input type="hidden" name="workType" value="" />
      <input type="hidden" name="disclosedIncentive" value="" />
      <div className="flex gap-2">
        {RATINGS.map((r) => (
          <button
            key={r.value}
            type="submit"
            name="rating"
            value={r.value}
            disabled={pending}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-[var(--border)] bg-white p-3 text-sm font-semibold transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 disabled:opacity-50"
          >
            <span className="text-lg">{r.emoji}</span>
            <span>{r.label}</span>
          </button>
        ))}
      </div>
      {state.error ? <p className="text-sm font-medium text-red-600">{state.error}</p> : null}
    </form>
  );
}
