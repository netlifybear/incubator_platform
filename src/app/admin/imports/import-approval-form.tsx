"use client";

import { useActionState, useState } from "react";
import { approveImportAction, rejectImportAction, type ImportActionState } from "@/app/admin/actions";

export function ImportApprovalForm({ importId, defaultTrustPolicy = "all" }: { importId: string; defaultTrustPolicy?: string }) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [trustPolicy, setTrustPolicy] = useState(defaultTrustPolicy);

  const [approveState, approveDispatch, approvePending] = useActionState(
    approveImportAction,
    { error: undefined, success: undefined } as ImportActionState,
  );

  const [rejectState, rejectDispatch, rejectPending] = useActionState(
    rejectImportAction,
    { error: undefined, success: undefined } as ImportActionState,
  );

  if (approveState?.success || rejectState?.success) {
    return (
      <p className="text-sm font-medium text-green-700">
        {approveState?.success ?? rejectState?.success ?? "Done"}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {(approveState?.error ?? rejectState?.error) ? (
        <p className="text-sm font-medium text-red-700">
          {approveState?.error ?? rejectState?.error}
        </p>
      ) : null}

      <form action={approveDispatch} className="flex items-center gap-2">
        <input type="hidden" name="importId" value={importId} />
        <input type="hidden" name="trustPolicy" value={trustPolicy} />
        <select
          value={trustPolicy}
          onChange={(e) => setTrustPolicy(e.target.value)}
          className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs"
        >
          <option value="all">All data</option>
          <option value="badges_only">Badges only</option>
          <option value="points_only">Points only</option>
        </select>
        <button
          type="submit"
          disabled={approvePending}
          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {approvePending ? "Approving..." : "Approve"}
        </button>
      </form>

      {showRejectForm ? (
        <form action={rejectDispatch} className="flex flex-col gap-2">
          <input type="hidden" name="importId" value={importId} />
          <textarea
            name="reason"
            placeholder="Reason for rejection..."
            rows={2}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={rejectPending}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {rejectPending ? "Rejecting..." : "Confirm rejection"}
            </button>
            <button
              type="button"
              onClick={() => setShowRejectForm(false)}
              className="rounded-xl bg-[var(--panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowRejectForm(true)}
          className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        >
          Reject
        </button>
      )}
    </div>
  );
}
