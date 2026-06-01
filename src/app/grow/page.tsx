import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { getFounderPoints } from "@/lib/points";
import { computeTierProgress, computeReviewStreak } from "@/lib/rewards";
import { getBacklinkSnapshots } from "@/lib/backlinks";
import { BacklinkVelocityChart } from "@/app/components/backlink-velocity-chart";
import { prisma } from "@/lib/prisma";
import { ReputationImportCard } from "./reputation-import-card";

export default async function GrowPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    redirect("/");
  }

  const [points, badges, snapshots, backlinkCount] = await Promise.all([
    getFounderPoints(founder.id),
    prisma.badge.count({ where: { userId: founder.id } }),
    getBacklinkSnapshots(founder.id),
    prisma.backlinkLog.count({ where: { userId: founder.id } }),
  ]);

  const tier = computeTierProgress(points.total);
  const streak = computeReviewStreak(founder.lastReviewDate);
  const profilePublic = founder.publicProfileEnabled;
  const profileViews = founder.profileViewCount;

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow-ambient)]">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            {founder.cohort.name}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">Grow</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Your portable reputation. Track backlinks, earn badges, and let the world
            find your founder profile.
          </p>
          {profilePublic ? (
            <Link
              href={`/founder/${founder.profileSlug}`}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)]"
            >
              View public profile
            </Link>
          ) : (
            <Link
              href="/profile/settings"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)]"
            >
              Enable public profile
            </Link>
          )}
        </section>

        <div className="grid gap-3 sm:grid-cols-4">
          <MetricCard label="Total points" value={points.total} />
          <MetricCard label="Current tier" value={tier?.current.title ?? "New"} />
          <MetricCard label="Profile views" value={profileViews} />
          <MetricCard label="Backlinks" value={backlinkCount} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Profile</h2>
              <Link href="/profile/settings" className="text-sm font-semibold text-[var(--accent)]">
                Edit
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-[var(--panel)] px-4 py-3">
                <span className="text-sm text-[var(--muted)]">Public profile</span>
                <span className={profilePublic ? "text-sm font-semibold text-green-700" : "text-sm font-semibold text-[var(--muted)]"}>
                  {profilePublic ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--panel)] px-4 py-3">
                <span className="text-sm text-[var(--muted)]">Profile completeness</span>
                <span className="text-sm font-semibold">{founder.profileCompletePercentage}%</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--panel)] px-4 py-3">
                <span className="text-sm text-[var(--muted)]">Review streak</span>
                <span className="text-sm font-semibold">{streak > 0 ? `${streak} week${streak === 1 ? "" : "s"}` : "None"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--panel)] px-4 py-3">
                <span className="text-sm text-[var(--muted)]">Badges earned</span>
                <span className="text-sm font-semibold">{badges}</span>
              </div>
              {tier && (
                <div className="rounded-xl bg-[var(--panel)] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--muted)]">Next tier</span>
                    <span className="text-sm font-semibold">{tier.next?.title ?? "Max"}</span>
                  </div>
                  {tier.next && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${Math.round(tier.progress * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/leaderboard" className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]">Leaderboard</Link>
              <Link href="/rewards" className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]">Rewards</Link>
              <Link href="/badges" className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]">Badges</Link>
              <Link href="/nominations" className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]">Nominations</Link>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">SEO</h2>
              <Link href="/seo" className="text-sm font-semibold text-[var(--accent)]">
                Guide
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-[var(--panel)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{founder.gscEmail ? "Google Search Console" : "GSC not connected"}</p>
                  {founder.gscEmail ? <p className="text-xs text-[var(--muted)]">{founder.gscEmail}</p> : null}
                </div>
                <Link href="/backlinks" className="text-sm font-semibold text-[var(--accent)]">
                  {founder.gscEmail ? "Manage" : "Connect"}
                </Link>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--panel)] px-4 py-3">
                <span className="text-sm text-[var(--muted)]">Verified backlinks</span>
                <span className="text-sm font-semibold">
                  {snapshots.length > 0 ? snapshots[snapshots.length - 1].verifiedCount : 0}
                </span>
              </div>
              <Link
                href="/backlinks"
                className="mt-2 inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              >
                Manage backlinks
              </Link>
            </div>
          </section>
        </div>

        <BacklinkVelocityChart snapshots={snapshots} />

        <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Recommended actions</h2>
          <div className="mt-4 space-y-2">
            {!profilePublic ? (
              <ActionItem
                label="Enable your public profile"
                detail="Get discovered by search engines and peers"
                href="/profile/settings"
              />
            ) : null}
            {streak === 0 ? (
              <ActionItem
                label="Write a review this week"
                detail="Keep your streak alive and earn points"
                href="/"
              />
            ) : null}
            {backlinkCount === 0 ? (
              <ActionItem
                label="Add your first backlink"
                detail="Track domains that mention your startup"
                href="/backlinks"
              />
            ) : null}
            {!founder.gscEmail ? (
              <ActionItem
                label="Connect Google Search Console"
                detail="Auto-discover referring domains"
                href="/backlinks"
              />
            ) : null}
            <ActionItem
              label="Export your reputation"
              detail="Download a signed JWT of your profile, points, and badges"
              href="/api/reputation/export"
            />
            {founder.profileSlug ? (
              <ActionItem
                label="Your credibility report"
                detail="Verifiable reputation report for investors and partners"
                href={`/founder/${founder.profileSlug}/credibility`}
              />
            ) : null}
            <ReputationImportCard />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-ambient)]">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function ActionItem({ label, detail, href }: { label: string; detail: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 transition hover:border-[var(--accent)]"
    >
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-[var(--muted)]">{detail}</p>
      </div>
      <span className="text-sm text-[var(--accent)]">→</span>
    </Link>
  );
}
