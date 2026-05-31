import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";


export default async function SEOPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  return (
    <AppShell founder={founder} cohortName={founder.cohort?.name ?? undefined}>
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          SEO & Authority
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Build legitimate authority without crossing ethical lines.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          This guide follows Google Search Essentials — the same rules Google uses
          to evaluate websites. The goal is durable authority, not quick ranking
          tricks.
        </p>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Your foundation</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <p className="text-lg font-semibold">Completed profile</p>
            <p className="mt-2 leading-7 text-[var(--muted)]">
              Your founder profile on this platform includes schema.org structured
              data, which helps search engines understand who you are and what you
              build.
            </p>
            <Link
              href="/profile/settings"
              className="mt-4 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Edit profile
            </Link>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <p className="text-lg font-semibold">Named reviews</p>
            <p className="mt-2 leading-7 text-[var(--muted)]">
              Writing detailed, named vendor reviews creates authentic content that
              helps other founders. Your reviews are attributed to your profile as
              genuine editorial content.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Browse vendors
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Google Search Essentials — what matters for founders
        </h2>
        <div className="mt-5 space-y-4">
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="flex items-start gap-3">
              <span className="mt-1 shrink-0 text-lg">{'\u2705'}</span>
              <div>
                <h3 className="font-semibold">Helpful content</h3>
                <p className="mt-2 leading-7 text-[var(--muted)]">
                  Write for people, not search engines. Detailed founder reviews,
                  genuine startup stories, and useful public profiles naturally
                  demonstrate expertise and experience. Google rewards content that
                  helps users make decisions.
                </p>
              </div>
            </div>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="flex items-start gap-3">
              <span className="mt-1 shrink-0 text-lg">{'\u2705'}</span>
              <div>
                <h3 className="font-semibold">Expertise and trust (E-E-A-T)</h3>
                <p className="mt-2 leading-7 text-[var(--muted)]">
                  Your profile demonstrates experience and expertise through
                  verifiable cohort membership, named reviews, and genuine startup
                  context. Structured data helps search engines surface this
                  information in knowledge panels and rich results.
                </p>
              </div>
            </div>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="flex items-start gap-3">
              <span className="mt-1 shrink-0 text-lg">{'\u2705'}</span>
              <div>
                <h3 className="font-semibold">Editorial links</h3>
                <p className="mt-2 leading-7 text-[var(--muted)]">
                  Links to your startup from your founder profile are editorial
                  attribution — they help people find your work. Avoid schemes that
                  require reciprocal links, paid placements, or link exchanges.
                  Legitimate directories and genuine recommendations are the durable
                  approach.
                </p>
              </div>
            </div>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="flex items-start gap-3">
              <span className="mt-1 shrink-0 text-lg">{'\u274C'}</span>
              <div>
                <h3 className="font-semibold">What to avoid</h3>
                <p className="mt-2 leading-7 text-[var(--muted)]">
                  Link spam, reciprocal-link requirements, paid badges, thin
                  AI-generated content, keyword stuffing, and automated link
                  exchanges all violate Google Search Essentials. These tactics
                  can lead to manual actions or ranking drops. The ethical path is
                  also the durable path.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Track your backlinks</h2>
        <p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">
          Monitor where your startup is mentioned online. This is informational
          tracking — not a guarantee of ranking improvement.
        </p>
        <Link
          href="/backlinks"
          className="mt-4 inline-flex rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white"
        >
          Go to backlink dashboard
        </Link>
      </section>
    </AppShell>
  );
}
