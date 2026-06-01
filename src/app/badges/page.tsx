import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { getBadgesForFounder } from "@/lib/badges";
import { BADGE_DEFINITIONS } from "@/config/badge-definitions";

export default async function BadgesPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  const badges = await getBadgesForFounder(founder.id);
  const earnedTypes = new Set(badges.map((b) => b.type));

  return (
    <AppShell founder={founder}>
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Badges
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Your earned badges
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Badges represent your reputation across the platform — from verified cohort
          membership to review quality and community contributions.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.length === 0 ? (
          <div className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm sm:col-span-2 lg:col-span-3">
            <p className="text-xl font-semibold">No badges earned yet.</p>
            <p className="mt-2 leading-7 text-[var(--muted)]">
              Write reviews and complete your profile to earn badges.
            </p>
          </div>
        ) : (
          badges.map((badge) => {
            const def = BADGE_DEFINITIONS.find((d) => d.type === badge.type);
            return (
              <div
                key={badge.type}
                className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
              >
                <div className="text-4xl">{badge.icon}</div>
                <h2 className="mt-4 text-xl font-semibold">{badge.label}</h2>
                <p className="mt-2 leading-7 text-[var(--muted)]">
                  {def?.description ?? badge.description}
                </p>
                <p className="mt-4 text-sm text-[var(--muted)]">
                  Earned{" "}
                  {"earnedAt" in badge && badge.earnedAt
                    ? new Date(badge.earnedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "automatically"}
                </p>
              </div>
            );
          })
        )}
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">All badge types</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BADGE_DEFINITIONS.map((def) => {
            const earned = earnedTypes.has(def.type);
            return (
              <div
                key={def.type}
                className={`rounded-2xl border p-5 ${earned ? "border-green-200 bg-green-50/50" : "border-[var(--border)] bg-[var(--panel)] opacity-60"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{def.icon}</span>
                  <div>
                    <p className="font-semibold">{def.label}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {earned ? "Earned" : def.criteria}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
