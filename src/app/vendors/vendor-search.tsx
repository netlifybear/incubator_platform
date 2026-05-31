"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type VendorSearchProps = {
  query: string;
  selectedCategory?: string;
  selectedSort: "name" | "rating" | "trending" | "reviews";
  categories: string[];
};

export function VendorSearch({
  query,
  selectedCategory,
  selectedSort,
  categories,
}: VendorSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
      }
      const qs = next.toString();
      return `/vendors${qs ? `?${qs}` : ""}`;
    },
    [searchParams],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          defaultValue={query}
          placeholder="Search vendors..."
          className="min-w-0 flex-1 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              router.push(buildUrl({ q: (e.target as HTMLInputElement).value || undefined }));
            }
          }}
        />
        <select
          defaultValue={selectedSort}
          onChange={(e) =>
            router.push(buildUrl({ sort: e.target.value === "name" ? undefined : e.target.value }))
          }
          className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm"
        >
          <option value="name">Sort: Name</option>
          <option value="rating">Sort: Rating</option>
          <option value="trending">Sort: Trending</option>
          <option value="reviews">Sort: Most Reviews</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => router.push(buildUrl({ category: undefined }))}
          className={`rounded-full border px-4 py-2 text-sm font-medium ${
            !selectedCategory
              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
              : "border-[var(--border)] bg-white/50"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              router.push(buildUrl({ category: cat === selectedCategory ? undefined : cat }))
            }
            className={`rounded-full border px-4 py-2 text-sm font-medium ${
              selectedCategory === cat
                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                : "border-[var(--border)] bg-white/50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </section>
  );
}
