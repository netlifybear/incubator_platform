"use client";

import { useActionState } from "react";
import { updateExchangeAction } from "./actions";

export function ExchangeActions({
  exchangeId,
  status: currentStatus,
}: {
  exchangeId: string;
  status?: string;
}) {
  const [publishState, publishAction, publishPending] = useActionState(
    updateExchangeAction,
    {},
  );

  const [declineState, declineAction, declinePending] = useActionState(
    updateExchangeAction,
    {},
  );

  if (currentStatus === "accepted") {
    return (
      <div className="flex items-center gap-2">
        <form action={publishAction}>
          <input type="hidden" name="exchangeId" value={exchangeId} />
          <input type="hidden" name="status" value="published" />
          <div className="flex items-center gap-2">
            <input
              name="publishedUrl"
              type="url"
              placeholder="Published post URL"
              required
              className="w-56 rounded-xl border border-[var(--border)] bg-white px-3 py-1.5 text-sm"
            />
            <button
              type="submit"
              disabled={publishPending}
              className="cursor-pointer rounded-full bg-green-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {publishPending ? "..." : "Mark published"}
            </button>
          </div>
          {publishState.error && (
            <p className="mt-1 text-sm text-red-600">{publishState.error}</p>
          )}
          {publishState.success && (
            <p className="mt-1 text-sm text-green-600">{publishState.success}</p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <form action={declineAction}>
        <input type="hidden" name="exchangeId" value={exchangeId} />
        <input type="hidden" name="status" value="declined" />
        <button
          type="submit"
          disabled={declinePending}
          className="cursor-pointer rounded-full border border-red-200 px-4 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          Decline
        </button>
        {declineState.error && (
          <p className="mt-1 text-sm text-red-600">{declineState.error}</p>
        )}
      </form>
      <form action={publishAction}>
        <input type="hidden" name="exchangeId" value={exchangeId} />
        <input type="hidden" name="status" value="accepted" />
        <button
          type="submit"
          disabled={publishPending}
          className="cursor-pointer rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          Accept
        </button>
        {publishState.error && (
          <p className="mt-1 text-sm text-red-600">{publishState.error}</p>
        )}
      </form>
    </div>
  );
}
