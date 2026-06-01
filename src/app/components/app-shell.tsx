import Link from "next/link";
import { getFounderDisplayName } from "@/lib/tenant-policy";
import { SignOutButton } from "./sign-out-button";

type AppShellProps = {
  children: React.ReactNode;
  cohortName?: string;
  founder?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

const coreLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/vendors", label: "Vendors" },
  { href: "/top-vendors", label: "Top vendors" },
  { href: "/requests", label: "Requests" },
];

const reputationLinks = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/badges", label: "Badges" },
  { href: "/rewards", label: "Rewards" },
  { href: "/nominations", label: "Nominations" },
  { href: "/profile/settings", label: "Profile" },
];

const growthLinks = [
  { href: "/exchanges", label: "Exchanges" },
  { href: "/sprints", label: "Sprints" },
  { href: "/analytics", label: "Analytics" },
  { href: "/seo", label: "SEO" },
  { href: "/backlinks", label: "Backlinks" },
];

function NavGroup({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        {title}
      </p>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="block rounded-xl px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--panel-strong)] hover:text-[var(--accent)]"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function AppShell({ children, cohortName, founder }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl lg:grid-cols-[17rem_1fr]">
        <aside className="border-b border-[var(--border)] bg-white px-4 py-4 lg:border-b-0 lg:border-r lg:py-6">
          <Link href="/" className="block rounded-xl px-3 py-2 text-lg font-semibold">
            Incubator Trust
          </Link>
          <nav className="mt-6 grid gap-6">
            <NavGroup title="Core" links={coreLinks} />
            <NavGroup title="Reputation" links={reputationLinks} />
            <NavGroup title="Growth" links={growthLinks} />
            {founder?.role === "admin" ? (
              <NavGroup
                title="Admin"
                links={[{ href: "/admin/requests", label: "Admin requests" }]}
              />
            ) : null}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-col">
          <header className="flex flex-col gap-3 border-b border-[var(--border)] bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Workspace
              </p>
              <p className="mt-1 font-medium">{cohortName ?? "No cohort assigned"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-[var(--muted)]">{founder ? getFounderDisplayName(founder) : "Guest"}</span>
              {founder ? <SignOutButton /> : null}
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
