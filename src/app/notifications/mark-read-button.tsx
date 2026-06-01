"use client";

import { useRouter } from "next/navigation";
import { markNotificationRead, markAllNotificationsRead } from "./actions";

export function MarkReadButton({ id }: { id: string }) {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await markNotificationRead(id);
        router.refresh();
      }}
      className="shrink-0 rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/10"
    >
      Mark read
    </button>
  );
}

export function MarkAllReadButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await markAllNotificationsRead();
        router.refresh();
      }}
      className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
    >
      Mark all read
    </button>
  );
}
