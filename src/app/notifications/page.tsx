import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { getNotifications } from "@/lib/notifications";
import { MarkReadButton, MarkAllReadButton } from "./mark-read-button";

export default async function NotificationsPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    redirect("/");
  }

  const notifications = await getNotifications(founder.id);
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Notifications</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {unread > 0 ? `${unread} unread` : "All caught up"}
            </p>
          </div>
          {unread > 0 ? <MarkAllReadButton /> : null}
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-[var(--border)] bg-white/70 p-12 text-center shadow-sm">
            <p className="text-base text-[var(--muted)]">No notifications yet.</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              When someone asks about a vendor you reviewed or sends a guest post request,
              you&apos;ll see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start justify-between gap-4 rounded-2xl border border-[var(--border)] px-5 py-4 transition ${n.readAt ? "bg-white/50" : "bg-[var(--accent)]/5"}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {n.link ? (
                      <Link href={n.link} className="font-semibold text-[var(--foreground)] no-underline">
                        {n.title}
                      </Link>
                    ) : (
                      <p className="font-semibold">{n.title}</p>
                    )}
                    {!n.readAt ? (
                      <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                    ) : null}
                  </div>
                  {n.body ? (
                    <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{n.body}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {n.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {!n.readAt ? (
                  <MarkReadButton id={n.id} />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
