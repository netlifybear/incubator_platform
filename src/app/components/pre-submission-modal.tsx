"use client";

import { useState } from "react";
import type { ChecklistItem } from "@/lib/review-quality";

type PreSubmissionModalProps = {
  checklist: ChecklistItem[];
  reviewText: string;
  onConfirm: () => void;
  onEdit: () => void;
  disableBypass?: boolean;
};

export function PreSubmissionModal({
  checklist,
  reviewText,
  onConfirm,
  onEdit,
  disableBypass = false,
}: PreSubmissionModalProps) {
  const [showBypass, setShowBypass] = useState(false);
  const allPassed = checklist.every((c) => c.passed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold">Review Quality Checklist</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
          Before posting, review your review:
        </p>

        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-sm leading-6 text-[var(--muted)]">
          {reviewText.length > 200
            ? reviewText.slice(0, 200) + "..."
            : reviewText}
        </div>

        <div className="mt-4 space-y-3">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-3 ${
                item.passed
                  ? "border-green-200 bg-green-50"
                  : "border-[var(--border)] bg-white/70"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 font-bold">
                  {item.passed ? "\u2705" : "\u2610"}
                </span>
                <div>
                  <p className={`text-sm font-medium ${item.passed ? "text-green-800" : ""}`}>
                    {item.label}
                  </p>
                  {!item.passed && (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {"\u2192"} {item.suggestion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {allPassed ? (
            <p className="text-sm font-medium text-green-700">
              All checks passed! Ready to post.
            </p>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              You can still post — these are suggestions, not requirements.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
            >
              Edit review
            </button>

            {allPassed ? (
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white"
              >
                Post review
              </button>
            ) : disableBypass ? (
              <p className="text-sm font-medium text-red-700">
                Review must be at least 20 characters.
              </p>
            ) : showBypass ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBypass(false)}
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white"
                >
                  Post anyway
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowBypass(true)}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
              >
                Post anyway
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
