import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { getLeaderboard } from "@/lib/leaderboard";


export default async function LeaderboardPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    redirect("/");
  }

  const entries = await getLeaderboard(founder.cohortId);

  const currentUserId = founder.id;

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Leaderboard
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Cohort contributions at a glance.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Ranked by quality-adjusted review points, badges, and helpful votes. A healthy
          cohort has diverse participation, not just a few top contributors.
        </p>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        {entries.length === 0 ? (
          <p className="text-[var(--muted)]">
            No founders in this cohort yet.
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => {
              const isCurrentUser = entry.userId === currentUserId;
              return (
                <div
                  key={entry.userId}
                  className={`rounded-2xl border p-4 ${
                    isCurrentUser
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border)] bg-[var(--panel)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--panel-strong)] text-lg font-bold">
                        {index === 0
                          ? "\uD83E\uDD47"
                          : index === 1
                            ? "\uD83E\uDD48"
                            : index === 2
                              ? "\uD83E\uDD49"
                              : `#${index + 1}`}
                      </span>
                      <div>
                        <p className="font-semibold">
                          {entry.name ?? entry.email}
                          {isCurrentUser ? (
                            <span className="ml-2 text-xs text-[var(--accent)]">
                              (you)
                            </span>
                          ) : null}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          {entry.reviewCount} review
                          {entry.reviewCount === 1 ? "" : "s"}
                          {entry.badgeCount > 0
                            ? ` \u00B7 ${entry.badgeCount} badge${entry.badgeCount === 1 ? "" : "s"}`
                            : ""}
                          {entry.points > 0
                            ? ` \u00B7 ${entry.points} pts`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {entry.points}
                      </p>
                      <p className="text-xs text-[var(--muted)]">points</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
