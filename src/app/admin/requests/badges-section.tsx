import { BADGE_DEFINITIONS } from "@/config/badge-definitions";
import { AwardBadgeForm } from "./award-badge-form";

function issuerTags(badge: (typeof BADGE_DEFINITIONS)[number]) {
  const tags: { label: string; color: string }[] = [];
  if (badge.computable) tags.push({ label: "Auto", color: "bg-blue-100 text-blue-700" });
  if (badge.awardableByAdmin) tags.push({ label: "Admin", color: "bg-amber-100 text-amber-700" });
  if (badge.awardableByVendor) tags.push({ label: "Vendor", color: "bg-purple-100 text-purple-700" });
  if (badge.awardableByInvestor) tags.push({ label: "Investor", color: "bg-green-100 text-green-700" });
  if (badge.nominatable) tags.push({ label: "Nominatable", color: "bg-teal-100 text-teal-700" });
  if (tags.length === 0) tags.push({ label: "Legacy", color: "bg-gray-100 text-gray-600" });
  return tags;
}

export async function AdminBadgesSection() {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Contribution tags
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Contribution tag types & criteria</h2>
          <p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">
            Contribution tags recognize contributions. Some are awarded automatically, others
            require admin approval. Vendors and investors can also award tags.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BADGE_DEFINITIONS.map((badge) => (
            <div
              key={badge.type}
              className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-lg">
                  {badge.icon} {badge.label}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {issuerTags(badge).map((tag) => (
                  <span
                    key={tag.label}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${tag.color}`}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {badge.description}
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-[var(--accent)] hover:underline">
                  Criteria
                </summary>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  {badge.criteria}
                </p>
              </details>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <p className="text-sm font-semibold">Award a tag to a founder</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Select issuer type (Admin/Vendor/Investor) then the tag type.
          </p>
          <div className="mt-4">
            <AwardBadgeForm />
          </div>
        </div>
      </div>
    </section>
  );
}

export function BadgesFallback() {
  return (
    <section className="animate-pulse rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="h-4 w-20 rounded-full bg-[var(--panel-strong)]" />
      <div className="mt-3 h-7 w-48 rounded-full bg-[var(--panel-strong)]" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="h-24 rounded-2xl bg-[var(--panel-strong)]" />
        <div className="h-24 rounded-2xl bg-[var(--panel-strong)]" />
      </div>
    </section>
  );
}
