import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { listOpenVendorRequestsForCohort, listIncomingTargetedRequests } from "@/lib/vendor-requests";
import { getSentRequests, getReceivedRequests } from "@/lib/guest-posts";
import { getCohortActivity } from "@/lib/activity";
import { badgeDefinition } from "@/config/badge-definitions";

export default async function ConnectPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    redirect("/");
  }

  const cohortId = founder.cohortId;
  const [incomingTargeted, openRequests, sentExchanges, receivedExchanges, activityEvents] = await Promise.all([
    listIncomingTargetedRequests(founder.id),
    listOpenVendorRequestsForCohort(cohortId),
    getSentRequests(founder.id, cohortId),
    getReceivedRequests(founder.id, cohortId),
    getCohortActivity(cohortId),
  ]);

  const unansweredCount = incomingTargeted.length;
  const pendingExchanges = [...sentExchanges, ...receivedExchanges].filter(
    (e) => e.status === "pending",
  ).length;

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow-ambient)]">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            {founder.cohort.name}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">Connect</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Ask your cohort for vendor recommendations and answer questions from peers.
          </p>
          {unansweredCount > 0 ? (
            <Link
              href="/requests"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)]"
            >
              Answer {unansweredCount} incoming question{unansweredCount === 1 ? "" : "s"}
            </Link>
          ) : (
            <Link
              href="/"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)]"
            >
              Ask your cohort
            </Link>
          )}
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="Unanswered questions" value={unansweredCount} />
          <MetricCard label="Open requests" value={openRequests.length} />
          <MetricCard label="Pending exchanges" value={pendingExchanges} />
        </div>

        {incomingTargeted.length > 0 && (
          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Incoming questions</h2>
              <Link href="/requests" className="text-sm font-semibold text-[var(--accent)]">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {incomingTargeted.slice(0, 5).map((req) => (
                <div key={req.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{req.user.name ?? "A founder"} asked about {req.category}</p>
                      {req.message ? <p className="mt-1 text-sm text-[var(--muted)]">{req.message}</p> : null}
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      {req.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {req.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My open requests</h2>
            <Link href="/requests" className="text-sm font-semibold text-[var(--accent)]">
              View all
            </Link>
          </div>
          {openRequests.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              You haven&apos;t requested any vendors yet. Ask your cohort for recommendations.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {openRequests.slice(0, 5).map((req) => (
                <div key={req.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{req.category}</p>
                    <span className="shrink-0 rounded-full bg-[var(--panel-strong)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-strong)]">
                      {req.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{req.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {pendingExchanges > 0 && (
          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Pending exchanges</h2>
            <div className="mt-4 space-y-2">
              {[...sentExchanges, ...receivedExchanges]
                .filter((e) => e.status === "pending")
                .slice(0, 5)
                .map((e) => (
                  <div key={e.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
                    <p className="font-semibold">{e.topic}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{e.message}</p>
                  </div>
                ))}
            </div>
            <Link
              href="/exchanges"
              className="mt-4 inline-block text-sm font-semibold text-[var(--accent)]"
            >
              Manage exchanges
            </Link>
          </section>
        )}

        {activityEvents.length > 0 ? (
          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Cohort activity</h2>
            <div className="mt-4 space-y-2">
              {activityEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
                  <span className="mt-0.5 shrink-0 text-sm">{activityIcon(event.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{event.user.name ?? "A founder"}</span>
                      {" "}{activityLabel(event)}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {event.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Cohort
          </h2>
          <p className="mt-2 text-xl font-semibold">Founders in your cohort</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            See who else is building in this incubator cohort. You can view public profiles and
            request recommendations.
          </p>
          <Link
            href="/founders"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)]"
          >
            Browse founders
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-ambient)]">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function activityIcon(type: string) {
  switch (type) {
    case "review_written": return "✍️";
    case "badge_earned":
    case "tag_earned": return "🏅";
    case "exchange_completed": return "📝";
    case "request_answered": return "💬";
    default: return "•";
  }
}

function activityLabel(event: { type: string; metadata: Prisma.JsonValue }) {
  const m = event.metadata as Record<string, string | undefined>;
  switch (event.type) {
    case "review_written":
      return <>reviewed <span className="font-medium">{m.vendorName ?? "a vendor"}</span></>;
    case "badge_earned":
    case "tag_earned":
      return <>earned the <span className="font-medium">{badgeLabel(m.tagType ?? m.badgeType ?? "")}</span> contribution tag</>;
    case "exchange_completed":
      return <>published a guest post{m.topic ? `: "${m.topic}"` : ""}</>;
    case "request_answered":
      return <>answered a question about <span className="font-medium">{m.category ?? ""}</span></>;
    default:
      return <>{event.type}</>;
  }
}

function badgeLabel(type: string) {
  const def = badgeDefinition(type);
  return def?.label ?? type;
}
