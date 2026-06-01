"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { markNotificationRead, markAllNotificationsRead } from "@/app/notifications/actions";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setCount(data.unread);
        setNotifications(data.notifications);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setCount((c) => Math.max(0, c - 1));
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    setCount(0);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[var(--muted)] transition hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-xl">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            {count > 0 ? (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--muted)]">No notifications yet</p>
          ) : (
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`group relative rounded-xl px-3 py-2.5 text-sm transition hover:bg-[var(--panel)] ${n.readAt ? "" : "bg-[var(--accent)]/5"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {n.link ? (
                        <Link href={n.link} className="font-medium text-[var(--foreground)] no-underline">
                          {n.title}
                        </Link>
                      ) : (
                        <p className="font-medium">{n.title}</p>
                      )}
                      {n.body ? (
                        <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)] line-clamp-2">{n.body}</p>
                      ) : null}
                    </div>
                    {!n.readAt ? (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)] opacity-0 transition hover:bg-[var(--accent)]/10 group-hover:opacity-100"
                      >
                        Read
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/notifications"
            className="mt-1 block rounded-xl px-3 py-2 text-center text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--panel)]"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
