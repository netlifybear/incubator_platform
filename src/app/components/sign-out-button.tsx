"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/signin" })}
      className="cursor-pointer rounded-xl border border-[var(--border)] bg-white px-3 py-2 font-medium transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      Sign out
    </button>
  );
}
