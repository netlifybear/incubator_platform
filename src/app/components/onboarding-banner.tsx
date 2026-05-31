import Link from "next/link";

type OnboardingBannerProps = {
  profileCompletePercentage: number;
  reviewCount: number;
  badgeCount: number;
};

type Step = {
  done: boolean;
  label: string;
  href: string;
  description: string;
};

export function OnboardingBanner({
  profileCompletePercentage,
  reviewCount,
  badgeCount,
}: OnboardingBannerProps) {
  if (profileCompletePercentage >= 100 && reviewCount > 0) {
    return null;
  }

  const steps: Step[] = [
    {
      done: profileCompletePercentage >= 100,
      label: "Complete your profile",
      href: "/profile/settings",
      description: "Add your name, bio, and startup details so other founders know who you are.",
    },
    {
      done: reviewCount > 0,
      label: "Write your first review",
      href: "/vendors",
      description: "Share your experience with a vendor to help the cohort.",
    },
    {
      done: badgeCount > 0,
      label: "Earn your first badge",
      href: "/rewards",
      description: "Contribute to unlock reputation milestones.",
    },
  ];

  const completed = steps.filter((s) => s.done).length;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-ambient)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Getting started
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal">
            Welcome! Finish setup to unlock your reputation.
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {completed} of {steps.length} steps done
          </p>
        </div>
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xl font-bold text-white shadow-[var(--shadow-soft)]">
          {Math.round((completed / steps.length) * 100)}%
        </span>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {steps.map((step, i) => (
          <Link
            key={step.label}
            href={step.href}
            className={`rounded-xl border p-4 transition hover:-translate-y-0.5 ${
              step.done
                ? "border-green-200 bg-green-50/70"
                : "border-[var(--border)] bg-white hover:border-[var(--accent)]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  step.done
                    ? "bg-green-500 text-white"
                    : "bg-[var(--panel-strong)] text-[var(--muted)]"
                }`}
              >
                {step.done ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : String(i + 1)}
              </span>
              <span
                className={`font-semibold ${step.done ? "text-green-700" : ""}`}
              >
                {step.label}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {step.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
