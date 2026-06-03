import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { WorkflowStrip } from "@/app/components/workflow-strip";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { getBacklinkSnapshots } from "@/lib/backlinks";
import { getBadgesForFounder } from "@/lib/badges";

function computeProfilePercentage(profile: {
  name?: string | null;
  bio?: string | null;
  startupUrl?: string | null;
  startupName?: string | null;
  profileSlug?: string | null;
}): number {
  const fields = [
    Boolean(profile.name),
    Boolean(profile.bio),
    Boolean(profile.startupUrl),
    Boolean(profile.startupName),
    Boolean(profile.profileSlug),
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

function scoreColor(pct: number) {
  if (pct >= 80) return "text-green-700";
  if (pct >= 50) return "text-amber-700";
  return "text-red-700";
}

export default async function SeoPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    redirect("/");
  }

  const [snapshots, badges] = await Promise.all([
    getBacklinkSnapshots(founder.id),
    getBadgesForFounder(founder.id),
  ]);

  const profilePct = computeProfilePercentage(founder);
  const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const hasGsc = Boolean(founder.gscEmail);
  const hasPublicProfile = founder.publicProfileEnabled;
  const hasProfileSlug = Boolean(founder.profileSlug);
  const hasBio = Boolean(founder.bio);
  const hasStartupUrl = Boolean(founder.startupUrl);
  const hasStartupName = Boolean(founder.startupName);
  const hasName = Boolean(founder.name);
  const hasBadge = badges.length > 0;
  const verifiedBacklinks = latest?.verifiedCount ?? 0;

  const checks = [
    { label: "Name set", done: hasName, hint: "Your display name helps search engines identify you." },
    { label: "Startup name set", done: hasStartupName, hint: "Shows what company you're associated with." },
    { label: "Startup URL set", done: hasStartupUrl, hint: "Links your profile to your startup's domain." },
    { label: "Bio written", done: hasBio, hint: "A bio gives search engines context about you." },
    { label: "Profile slug set", done: hasProfileSlug, hint: "Creates a clean URL like /founder/your-name." },
    { label: "Public profile enabled", done: hasPublicProfile, hint: "Search engines can only crawl intentionally public profiles." },
    { label: "Google Search Console connected", done: hasGsc, hint: "Auto-discovers backlinks from across the web." },
    { label: "At least one contribution tag earned", done: hasBadge, hint: "Contribution tags display on your public profile." },
    { label: "At least one verified backlink", done: verifiedBacklinks > 0, hint: "Each backlink is a citation signal." },
  ];

  const doneCount = checks.filter((c) => c.done).length;
  const overallPct = Math.round((doneCount / checks.length) * 100);

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel-strong)] p-6 shadow-[var(--shadow-ambient)]">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            {founder.cohort.name}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">SEO Checklist</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Prepare public-safe founder profile, backlink, and structured-data surfaces
            for search and AI discovery without exposing private cohort activity.
          </p>
        </section>

        <WorkflowStrip active="grow" />

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${overallPct * 1.005} 100`}
                    className={scoreColor(overallPct)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                  {overallPct}%
                </span>
              </div>
              <div>
                <p className="text-xl font-semibold">SEO readiness</p>
                <p className={`text-sm font-medium ${scoreColor(overallPct)}`}>
                  {doneCount} of {checks.length} items complete
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Quick actions</h2>
            <div className="mt-4 space-y-2">
              {!hasPublicProfile ? (
                <ActionItem label="Enable public profile" detail="Make your profile searchable" href="/profile/settings" />
              ) : null}
              {!hasGsc ? (
                <ActionItem label="Connect Google Search Console" detail="Auto-discover backlinks" href="/backlinks" />
              ) : null}
              {profilePct < 100 ? (
                <ActionItem label="Complete your profile" detail={`${profilePct}% complete`} href="/profile/settings" />
              ) : null}
              <ActionItem label="Add backlinks" detail="Track domains mentioning you" href="/backlinks" />
              <ActionItem label="Export credibility packet" detail="Download signed profile data" href="/api/reputation/export" />
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Checklist</h2>
          <div className="mt-4 space-y-2">
            {checks.map((check) => (
              <div
                key={check.label}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${check.done ? "border-green-200 bg-green-50/50" : "border-[var(--border)] bg-[var(--panel)]"}`}
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${check.done ? "bg-green-500 text-white" : "bg-[var(--border)] text-[var(--muted)]"}`}>
                  {check.done ? "✓" : String(checks.indexOf(check) + 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${check.done ? "text-green-800" : ""}`}>{check.label}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{check.hint}</p>
                </div>
                {!check.done ? (
                  <span className="shrink-0 text-xs font-medium text-amber-700">Missing</span>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Resources</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/backlinks" className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 transition hover:border-[var(--accent)]">
              <p className="font-semibold">Backlinks</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Manage verified backlinks and view velocity</p>
            </Link>
            <Link href="/grow" className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 transition hover:border-[var(--accent)]">
              <p className="font-semibold">Public profile</p>
              <p className="mt-1 text-sm text-[var(--muted)]">View your grow hub with contribution tags and credibility factors</p>
            </Link>
            <Link href="/profile/settings" className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 transition hover:border-[var(--accent)]">
              <p className="font-semibold">Profile settings</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Edit name, bio, startup info, and slug</p>
            </Link>
            <Link href="/api/reputation/export" className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 transition hover:border-[var(--accent)]">
              <p className="font-semibold">Export credibility packet</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Download signed verification data for your profile</p>
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
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
