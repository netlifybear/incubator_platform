import { prisma } from "@/lib/prisma";

type BadgeAttemptsSectionProps = {
  limit?: number;
};

export async function AdminBadgeAttemptsSection({
  limit = 10,
}: BadgeAttemptsSectionProps) {
  const attempts = await prisma.tagAwardAttempt.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            External tag audit
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Recent tag award attempts</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Raw issuer secrets are never shown. Use this log to spot repeated failures,
            suspicious issuer activity, or successful external tag grants.
          </p>
        </div>
        <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-sm font-semibold">
          {attempts.length} shown
        </span>
      </div>

      {attempts.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-[var(--panel)] p-4 text-sm text-[var(--muted)]">
          No external tag award attempts recorded yet.
        </p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)]">
          <div className="grid grid-cols-6 gap-3 bg-[var(--panel-strong)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            <span>Issuer</span>
            <span>Status</span>
            <span>Reason</span>
            <span>Fingerprint</span>
            <span>IP</span>
            <span>When</span>
          </div>
          {attempts.map((attempt) => (
            <div
              key={attempt.id}
              className="grid grid-cols-6 gap-3 border-t border-[var(--border)] bg-white/60 px-4 py-3 text-sm"
            >
              <span className="font-semibold capitalize">{attempt.issuerType}</span>
              <span className={attempt.success ? "text-emerald-700" : "text-red-700"}>
                {attempt.success ? "Success" : "Failed"}
              </span>
              <span className="truncate text-[var(--muted)]">{attempt.error ?? "Awarded"}</span>
              <span className="font-mono text-xs text-[var(--muted)]">
                {attempt.secretHash.slice(0, 20)}...
              </span>
              <span className="truncate text-[var(--muted)]">{attempt.ipAddress ?? "—"}</span>
              <span className="text-[var(--muted)]">
                {attempt.createdAt.toLocaleString("en-US", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function BadgeAttemptsFallback() {
  return (
    <section className="animate-pulse rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="h-4 w-44 rounded-full bg-[var(--panel-strong)]" />
      <div className="mt-3 h-7 w-72 rounded-full bg-[var(--panel-strong)]" />
      <div className="mt-5 h-28 rounded-2xl bg-[var(--panel-strong)]" />
    </section>
  );
}
