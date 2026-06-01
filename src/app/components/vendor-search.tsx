"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

export function VendorSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams(window.location.search);
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      params.delete("category");
      router.push(`/?${params.toString()}`);
    },
    [value, router],
  );

  const handleClear = useCallback(() => {
    setValue("");
    const params = new URLSearchParams(window.location.search);
    params.delete("q");
    params.delete("category");
    router.push(`/?${params.toString()}`);
  }, [router]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search vendors..."
        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 pl-10 text-sm outline-none transition focus:border-[var(--accent)]"
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--panel-strong)]"
        >
          Clear
        </button>
      ) : null}
    </form>
  );
}
