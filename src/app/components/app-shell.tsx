import Link from "next/link";
import { getFounderDisplayName } from "@/lib/tenant-policy";
import { SignOutButton } from "./sign-out-button";
import { NotificationBell } from "./notification-bell";

type AppShellProps = {
  children: React.ReactNode;
  cohortName?: string;
  founder?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

const hubLinks = [
  { href: "/", label: "Write" },
  { href: "/connect", label: "Connect" },
  { href: "/grow", label: "Grow" },
];

const exploreLinks = [
  { href: "/founders", label: "Founders" },
  { href: "/cohorts", label: "Cohorts" },
  { href: "/invite", label: "Invite" },
];

function NavGroup({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        {title}
      </p>
      <div className="mt-2 space-y-1">
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
            <NavGroup title="Work" links={hubLinks} />
            <NavGroup title="Explore" links={exploreLinks} />
            {founder?.role === "admin" ? (
              <NavGroup
                title="Admin"
                links={[{ href: "/admin", label: "Admin" }]}
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
                {founder ? (
                  <Link
                    href="/profile/settings"
                    className="rounded-xl px-2 py-1 font-medium text-[var(--foreground)] transition hover:bg-[var(--panel-strong)] hover:text-[var(--accent)]"
                  >
                    {getFounderDisplayName(founder)}
                  </Link>
                ) : (
                  <span className="text-[var(--muted)]">Guest</span>
                )}
                {founder?.role === "alumni" ? (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                    Alumni
                  </span>
                ) : null}
                {founder ? <NotificationBell /> : null}
                {founder ? <SignOutButton /> : null}
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
