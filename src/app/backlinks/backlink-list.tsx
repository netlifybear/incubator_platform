"use client";

import { useActionState } from "react";
import {
  removeBacklinkAction,
  verifySingleAction,
  verifyAllAction as verifyAllActionServer,
  type BacklinkActionState,
} from "./actions";
import type { BacklinkEntry } from "@/lib/backlinks";

const initialState: BacklinkActionState = {};
const verifyInitialState: BacklinkActionState = {};

function RemoveButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(
    () => removeBacklinkAction(id),
    initialState,
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        {pending ? "Removing..." : "Remove"}
      </button>
      {state.success || state.error ? (
        <p className="mt-1 text-xs text-[var(--muted)]">
          {state.success ?? state.error}
        </p>
      ) : null}
    </form>
  );
}

function VerifyButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(
    () => verifySingleAction(id),
    verifyInitialState,
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer text-sm font-medium text-[var(--accent)] hover:opacity-80 disabled:opacity-50"
      >
        {pending ? "Checking..." : "Check now"}
      </button>
      {state.success || state.error ? (
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          {state.success ?? state.error}
        </p>
      ) : null}
    </form>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700" title="Page contains a link to your target URL">
        Verified
      </span>
    );
  }
  if (status === "reachable_no_link") {
    return (
      <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700" title="Domain is reachable but no link to your target URL was found on the page">
        Reachable, no link
      </span>
    );
  }
  if (status === "reachable") {
    return (
      <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700" title="Domain is reachable">
        Reachable
      </span>
    );
  }
  if (status === "lost") {
    return (
      <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        Lost
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
      Pending
    </span>
  );
}

export function BacklinkList({
  backlinks,
}: {
  backlinks: BacklinkEntry[];
}) {
  const [verifyAllState, verifyAllActionLocal, verifyAllPending] = useActionState(
    verifyAllActionServer,
    verifyInitialState,
  );

  if (backlinks.length === 0) {
    return null;
  }

  return (
    <div className="mt-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          {backlinks.filter((b) => b.status === "verified").length} verified,
          {" "}{backlinks.filter((b) => b.status === "reachable_no_link").length} reachable no link,
          {" "}{backlinks.filter((b) => b.status === "reachable").length} reachable,
          {" "}{backlinks.filter((b) => b.status === "lost").length} lost,
          {" "}{backlinks.filter((b) => b.status === "pending").length} pending
        </p>
        <form action={verifyAllActionLocal}>
          <button
            type="submit"
            disabled={verifyAllPending}
            className="cursor-pointer rounded-full border border-[var(--border)] bg-white px-4 py-1.5 text-sm font-medium transition hover:bg-[var(--panel)] disabled:opacity-50"
          >
            {verifyAllPending ? "Checking all..." : "Verify all"}
          </button>
        </form>
      </div>
      {verifyAllState.success || verifyAllState.error ? (
        <p className="mb-4 text-sm text-[var(--muted)]">
          {verifyAllState.success ?? verifyAllState.error}
        </p>
      ) : null}
      <div className="space-y-2">
        {backlinks.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-5 py-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-medium">
                  {entry.referringDomain}
                </p>
                <StatusBadge status={entry.status} />
              </div>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Discovered {new Date(entry.discoveredAt).toLocaleDateString()}
                {entry.lastCheckedAt
                  ? ` \u00B7 Last checked ${new Date(entry.lastCheckedAt).toLocaleDateString()}`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {entry.status !== "verified" && <VerifyButton id={entry.id} />}
              <RemoveButton id={entry.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
