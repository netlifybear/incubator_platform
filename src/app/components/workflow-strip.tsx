import Link from "next/link";

type WorkflowStep = {
  href: string;
  label: string;
  detail: string;
};

const STEPS: WorkflowStep[] = [
  {
    href: "/",
    label: "Write",
    detail: "Share vendor context that strengthens the private cohort trust graph.",
  },
  {
    href: "/connect",
    label: "Connect",
    detail: "Answer requests and turn cohort questions into useful operating memory.",
  },
  {
    href: "/grow",
    label: "Grow",
    detail: "See how contributions become credibility, public-safe reports, and portability.",
  },
];

export function WorkflowStrip({ active }: { active: "write" | "connect" | "grow" }) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
        Founder workflow
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {STEPS.map((step) => {
          const isActive = step.label.toLowerCase() === active;

          return (
            <Link
              key={step.label}
              href={step.href}
              className={`rounded-2xl border px-4 py-3 transition ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--border)] bg-[var(--panel)] hover:border-[var(--accent)]"
              }`}
            >
              <p className="text-sm font-semibold">{step.label}</p>
              <p className={`mt-1 text-xs leading-5 ${isActive ? "text-white/80" : "text-[var(--muted)]"}`}>
                {step.detail}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
