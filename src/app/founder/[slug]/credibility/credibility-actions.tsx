"use client";

export function CredibilityActions({ reputationJwt }: { reputationJwt: string }) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => window.print()}
        className="text-sm font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
      >
        Print or save PDF
      </button>
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(reputationJwt)}
        className="rounded-lg bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-strong)]"
      >
        Copy JWT
      </button>
    </div>
  );
}
