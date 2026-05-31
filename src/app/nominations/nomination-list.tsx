"use client";

import type { NominationWithUsers } from "@/lib/nominations";
import { badgeDefinition } from "@/config/badge-definitions";

export function NominationList({
  nominations,
  emptyMessage,
}: {
  nominations: NominationWithUsers[];
  emptyMessage: string;
}) {
  if (nominations.length === 0) {
    return <p className="text-[var(--muted)]">{emptyMessage}</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {nominations.map((n) => {
        const def = badgeDefinition(n.badgeType);
        return (
          <div
            key={n.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {def?.icon} {def?.label ?? n.badgeType}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {n.nominator.name ?? n.nominator.email} nominated{" "}
                  {n.nominee.name ?? n.nominee.email}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {n.reason}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  n.status === "pending"
                    ? "bg-amber-100 text-amber-800"
                    : n.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {n.status}
              </span>
            </div>
            {n.reviewerNote ? (
              <p className="mt-2 text-sm italic text-[var(--muted)]">
                Admin note: {n.reviewerNote}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--muted)]">
              {new Date(n.createdAt).toLocaleDateString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}
