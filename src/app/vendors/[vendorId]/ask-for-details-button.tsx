"use client";

import { useState } from "react";
import { useActionState } from "react";
import type { AskForDetailsState } from "./actions";

type Props = {
  action: (state: AskForDetailsState, formData: FormData) => Promise<AskForDetailsState>;
  reviewerName: string;
  vendorName: string;
};

export function AskForDetailsButton({ action, reviewerName, vendorName }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, { error: undefined, success: undefined });

  if (state.success) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)] hover:bg-[var(--accent)] hover:text-white transition-colors"
        >
          Ask for details
        </button>

        {open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl">
              <h3 className="text-xl font-semibold">Sent!</h3>
              <p className="mt-3 leading-7 text-[var(--muted)]">
                Your request will appear on {reviewerName}&apos;s requests page.
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-6 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)] hover:bg-[var(--accent)] hover:text-white transition-colors"
      >
        Ask for details
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl">
            <form action={formAction}>
              <h3 className="text-xl font-semibold">
                Ask {reviewerName} about {vendorName}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Send a brief message asking for more details about their experience.
              </p>
              <div className="mt-4">
                <label htmlFor="message" className="text-sm font-semibold">
                  Your message
                </label>
                <textarea
                  id="message"
                  name="message"
                  defaultValue=""
                  rows={3}
                  required
                  minLength={2}
                  placeholder="e.g. How was their onboarding process? Any issues with deliverables?"
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              {state.error ? (
                <p className="mt-3 text-sm font-medium text-red-600">{state.error}</p>
              ) : null}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-[var(--panel-strong)] px-4 py-2 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {pending ? "Sending..." : "Send request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
