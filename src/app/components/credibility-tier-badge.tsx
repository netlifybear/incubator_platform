import type { CredibilityTier } from "@/lib/credibility-tier";

const tierStyles: Record<CredibilityTier["key"], string> = {
  establishing: "border-gray-200 bg-gray-50 text-gray-700",
  verified: "border-sky-200 bg-sky-50 text-sky-800",
  trusted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  authority: "border-indigo-200 bg-indigo-50 text-indigo-800",
  leader: "border-amber-200 bg-amber-50 text-amber-900",
};

export function CredibilityTierBadge({
  tier,
  showDescription = false,
}: {
  tier: CredibilityTier;
  showDescription?: boolean;
}) {
  return (
    <div
      className={`inline-flex max-w-full items-center gap-3 rounded-full border px-3 py-2 ${tierStyles[tier.key]}`}
      aria-label={`Credibility tier: ${tier.label}`}
    >
      <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-white/80 px-1 text-[10px] font-bold">
        {tier.iconText}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-5">{tier.label}</span>
        {showDescription ? (
          <span className="block max-w-md text-xs leading-5 opacity-85">{tier.description}</span>
        ) : null}
      </span>
    </div>
  );
}
