import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { getActiveSprint, getSprintHistory } from "@/lib/sprints";

export default async function SprintsPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    redirect("/");
  }

  const [activeSprint, pastSprints] = await Promise.all([
    getActiveSprint(founder.cohortId!),
    getSprintHistory(founder.cohortId!),
  ]);

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Sprints
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Focused review pushes.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Sprints are time-limited campaigns to fill gaps in the vendor directory.
          Write reviews during an active sprint to help your cohort and climb the leaderboard.
        </p>
      </section>

      {activeSprint ? (
        <ActiveSprintCard sprint={activeSprint} currentUserId={founder.id} />
      ) : (
        <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-8 text-center shadow-sm">
          <p className="text-lg font-semibold">No active sprint</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Check back later when an admin launches a new sprint.
          </p>
        </section>
      )}

      {pastSprints.length > 0 && (
        <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Past sprints</h2>
          <div className="mt-4 space-y-3">
            {pastSprints.map((sprint) => (
              <div key={sprint.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{sprint.name}</p>
                  <span className="text-sm text-[var(--muted)]">
                    {sprint.startsAt.toLocaleDateString()} — {sprint.endsAt.toLocaleDateString()}
                  </span>
                </div>
                {sprint.description && (
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{sprint.description}</p>
                )}
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {sprint.contributors.filter((c) => c.reviewCount > 0).length} founder
                  {sprint.contributors.filter((c) => c.reviewCount > 0).length === 1 ? "" : "s"} participated,
                  {" "}{sprint.contributors.reduce((s, c) => s + c.reviewCount, 0)} total reviews
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

async function ActiveSprintCard({
  sprint,
  currentUserId,
}: {
  sprint: {
    name: string;
    description: string | null;
    goalReviewCount: number;
    startsAt: Date;
    endsAt: Date;
    contributors: Array<{ userId: string; name: string | null; email: string; reviewCount: number }>;
  };
  currentUserId: string;
}) {
  const currentUserEntry = sprint.contributors.find((c) => c.userId === currentUserId);
  const myCount = currentUserEntry?.reviewCount ?? 0;
  const goal = sprint.goalReviewCount;
  const totalReviews = sprint.contributors.reduce((s, c) => s + c.reviewCount, 0);
  const participants = sprint.contributors.filter((c) => c.reviewCount > 0).length;

  return (
    <section className="rounded-3xl border-2 border-[var(--accent)] bg-white/70 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Active sprint
          </p>
          <h2 className="mt-1 text-2xl font-semibold">{sprint.name}</h2>
        </div>
        <span className="text-sm text-[var(--muted)]">
          {sprint.startsAt.toLocaleDateString()} — {sprint.endsAt.toLocaleDateString()}
        </span>
      </div>

      {sprint.description && (
        <p className="mt-2 leading-7 text-[var(--muted)]">{sprint.description}</p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatBox label="Your progress" value={`${myCount} / ${goal} reviews`} />
        <StatBox label="Total reviews" value={String(totalReviews)} />
        <StatBox label="Participants" value={String(participants)} />
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all"
          style={{ width: `${Math.min((myCount / goal) * 100, 100)}%` }}
        />
      </div>

      {sprint.contributors.length > 1 && (
        <div className="mt-6">
          <p className="text-sm font-semibold">Sprint leaderboard</p>
          <div className="mt-2 space-y-1">
            {sprint.contributors
              .filter((c) => c.reviewCount > 0)
              .slice(0, 10)
              .map((c, i) => (
                <div
                  key={c.userId}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                    c.userId === currentUserId
                      ? "bg-[var(--accent)]/10 font-semibold"
                      : "bg-[var(--panel)]"
                  }`}
                >
                  <span>
                    <span className="mr-2 text-[var(--muted)]">#{i + 1}</span>
                    {c.name ?? c.email}
                    {c.userId === currentUserId ? (
                      <span className="ml-2 text-xs text-[var(--accent)]">(you)</span>
                    ) : null}
                  </span>
                  <span className="text-[var(--muted)]">
                    {c.reviewCount} review{c.reviewCount === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </section>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 text-center">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
