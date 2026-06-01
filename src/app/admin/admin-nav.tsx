"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/cohorts", label: "Cohorts" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/reviews", label: "Reviews" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-1 rounded-2xl border border-[var(--border)] bg-white/70 p-1">
      {tabs.map((tab) => {
        const isActive = tab.href === "/admin"
          ? pathname === "/admin"
          : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--muted)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
