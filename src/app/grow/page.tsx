import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { computeReviewStreak } from "@/lib/rewards";
import { getBacklinkSnapshots } from "@/lib/backlinks";
import { BacklinkVelocityChart } from "@/app/components/backlink-velocity-chart";
import { ReputationImportCard } from "./reputation-import-card";
import { getFounderReferralStats } from "@/lib/invites";
import { getFounderImpactSummary } from "@/lib/impact";
import { getContributionFeedback } from "@/lib/contribution-feedback";
import { computeCredibilityFactors } from "@/lib/credibility-factors";

export default async function GrowPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    redirect("/");
  }

  const [impact, snapshots, referralStats, feedback] = await Promise.all([
    getFounderImpactSummary(founder.id),
    getBacklinkSnapshots(founder.id),
    getFounderReferralStats(founder.id),
    getContributionFeedback(founder.id, founder.cohortId),
  ]);
  const credibility = await computeCredibilityFactors(founder.id, { impact, useCache: true });

  const streak = computeReviewStreak(founder.lastReviewDate);
  const profilePublic = founder.publicProfileEnabled;

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow-ambient)]">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            {founder.cohort.name}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">Grow</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Your credibility and contribution trail. Track what you have shared, who it
            helped, and how your public founder profile is showing up.
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

        {credibility.isThinFile ? (
          <section className="rounded-3xl border border-[var(--border)] bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Welcome to Grow</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              This is your contribution hub. As you review vendors and participate in your cohort,
              your track record builds here. Start by writing your first review.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/" className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]">
                Browse vendors
              </Link>
              <Link href="/profile/settings" className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold transition hover:border-[var(--accent)]">
                Complete your profile
              </Link>
            </div>
          </section>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-4">
          <MetricCard label="Reviews shared" value={impact.reviewCount} />
          <MetricCard label="Helpful votes received" value={impact.helpfulVoteCount} />
          {!credibility.isThinFile ? (
            <>
              <MetricCard label="Profile views" value={impact.profileViewCount} />
              <MetricCard label="Verified backlinks" value={impact.verifiedBacklinkCount} />
            </>
          ) : null}
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
                <span className="text-sm text-[var(--muted)]">Referrals joined</span>
                <span className="text-sm font-semibold">{referralStats.accepted}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/leaderboard" className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]">Contribution view</Link>
              <Link href="/badges" className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]">Contribution tags</Link>
              <Link href="/nominations" className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]">Nominations</Link>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Impact</h2>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-[var(--panel)] px-4 py-3">
                <span className="text-sm text-[var(--muted)]">Vendors evaluated</span>
                <span className="text-sm font-semibold">{impact.reviewCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--panel)] px-4 py-3">
                <span className="text-sm text-[var(--muted)]">Founders helped</span>
                <span className="text-sm font-semibold">{impact.helpfulVoteCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--panel)] px-4 py-3">
                <span className="text-sm text-[var(--muted)]">Contribution signals</span>
                <span className="text-sm font-semibold">{impact.contributionSignalCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--panel)] px-4 py-3">
                <span className="text-sm text-[var(--muted)]">Verified backlinks</span>
                <span className="text-sm font-semibold">{impact.verifiedBacklinkCount}</span>
              </div>
              {streak > 0 ? (
                <div className="flex items-center justify-between rounded-xl bg-[var(--panel)] px-4 py-3">
                  <span className="text-sm text-[var(--muted)]">Active streak</span>
                  <span className="text-sm font-semibold">{streak} week{streak === 1 ? "" : "s"}</span>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Credibility factors</h2>
            {credibility.isThinFile ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm leading-6 text-[var(--muted)]">
                  You&apos;re getting started. Complete these steps to build your track record:
                </p>
                <ChecklistItem done={impact.reviewCount > 0} label="Write your first review" href="/" />
                <ChecklistItem done={founder.profileCompletePercentage >= 80} label="Complete your profile" href="/profile/settings" />
                <ChecklistItem done={Boolean(founder.gscEmail)} label="Connect Google Search Console" href="/backlinks" />
                <ChecklistItem done={founder.publicProfileEnabled} label="Enable your public profile" href="/profile/settings" />
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  credibility.summary === "strong"
                    ? "bg-green-100 text-green-800"
                    : credibility.summary === "developing"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-600"
                }`}>
                  {credibility.summary === "strong" ? "Strong" : credibility.summary === "developing" ? "Developing" : "Needs activity"}
                </span>
                {credibility.factors.filter(f => f.isPublic && f.key !== "reviewRecency").map((f) => (
                  <div key={f.key} className="flex items-center justify-between rounded-xl bg-[var(--panel)] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        f.status === "strong" ? "bg-green-500" : f.status === "developing" ? "bg-yellow-500" : "bg-gray-300"
                      }`} />
                      <span className="text-sm text-[var(--muted)]">{f.label}</span>
                    </div>
                    <span className="text-sm font-semibold">{f.value}</span>
                  </div>
                ))}
              </div>
            )}
            <Link href="/rewards" className="mt-4 inline-block text-sm font-semibold text-[var(--accent)]">
              Learn what feeds your credibility →
            </Link>
          </section>
        </div>

        <BacklinkVelocityChart snapshots={snapshots} />

        {feedback.helpfulVotesReceived > 0 || feedback.targetedQuestionsReceived > 0 || feedback.reviewsWritten > 0 ? (
          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Recent contribution impact</h2>
            <div className="mt-4 space-y-2">
              {feedback.helpfulVotesReceived > 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
                  <p className="text-sm leading-6">
                    <span className="font-semibold">{feedback.helpfulVotesReceived}</span> founder{feedback.helpfulVotesReceived === 1 ? "" : "s"} marked
                    {" "}your vendor reviews helpful this week.
                  </p>
                </div>
              ) : null}
              {feedback.targetedQuestionsReceived > 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
                  <p className="text-sm leading-6">
                    <span className="font-semibold">{feedback.targetedQuestionsReceived}</span> founder{feedback.targetedQuestionsReceived === 1 ? "" : "s"} asked
                    {" "}for more detail on vendors you know.
                  </p>
                </div>
              ) : null}
              {feedback.cohortActivityCount > 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
                  <p className="text-sm leading-6">
                    Your cohort recorded <span className="font-semibold">{feedback.cohortActivityCount}</span> contribution
                    {" "}event{feedback.cohortActivityCount === 1 ? "" : "s"} this week.
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Recent contribution impact</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Write a detailed vendor review to start building visible impact.
            </p>
          </section>
        )}

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
                detail="Add fresh context that helps other founders evaluate vendors"
                href="/"
              />
            ) : null}
            {impact.verifiedBacklinkCount === 0 ? (
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
              label="Export your credibility packet"
              detail="Download a signed JWT of your profile, contribution tags, and signals"
              href="/api/reputation/export"
            />
            {founder.profileSlug ? (
              <ActionItem
                label="Your credibility report"
                detail="Verifiable report for investors and partners"
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

function ChecklistItem({ done, label, href }: { done: boolean; label: string; href: string }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${done ? "bg-green-50 text-green-700" : "bg-[var(--panel)] hover:border-[var(--accent)]"}`}
    >
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        done ? "bg-green-500 text-white" : "border border-[var(--muted)]"
      }`}>
        {done ? "✓" : ""}
      </span>
      <span className={done ? "" : "font-medium"}>{label}</span>
      {!done && <span className="ml-auto text-[var(--accent)]">→</span>}
    </Link>
  );
}
