import type { BacklinkAnalysisResult } from "@/lib/backlink-analysis";

type BacklinkAnalysisPanelProps = {
  analysis: BacklinkAnalysisResult;
};

function scoreBar(value: number, label: string) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--muted)]">{label}</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[var(--panel-strong)]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function BacklinkAnalysisPanel({ analysis }: BacklinkAnalysisPanelProps) {
  if (analysis.totalLinks === 0) return null;

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Link profile analysis</h2>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
        Algorithmic assessment of your backlink profile based on {analysis.totalLinks} link{analysis.totalLinks === 1 ? "" : "s"}.
      </p>

      <div className="mt-5 space-y-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--muted)]">Natural Link Score</span>
            <span className={`text-2xl font-bold ${analysis.naturalLinkScore >= 0.7 ? "text-green-600" : analysis.naturalLinkScore >= 0.4 ? "text-amber-600" : "text-red-600"}`}>
              {Math.round(analysis.naturalLinkScore * 100)}%
            </span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[var(--panel-strong)]">
            <div
              className={`h-full rounded-full ${analysis.naturalLinkScore >= 0.7 ? "bg-green-500" : analysis.naturalLinkScore >= 0.4 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${Math.round(analysis.naturalLinkScore * 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {scoreBar(analysis.anchorTextScore, "Anchor text diversity")}
          {scoreBar(analysis.contextScore, "Contextual relevance")}
          {scoreBar(analysis.velocityScore, "Link velocity")}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
            Anchor text breakdown
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-xl bg-green-50 p-3">
              <p className="text-lg font-bold text-green-700">{analysis.anchorTextBreakdown.brandedPct}%</p>
              <p className="text-xs text-green-600">Branded</p>
              <p className="text-xs text-green-500">{analysis.anchorTextBreakdown.branded} links</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3">
              <p className="text-lg font-bold text-blue-700">{analysis.anchorTextBreakdown.genericPct}%</p>
              <p className="text-xs text-blue-600">Generic</p>
              <p className="text-xs text-blue-500">{analysis.anchorTextBreakdown.generic} links</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-lg font-bold text-amber-700">{analysis.anchorTextBreakdown.exactMatchPct}%</p>
              <p className="text-xs text-amber-600">Exact-match</p>
              <p className="text-xs text-amber-500">{analysis.anchorTextBreakdown.exactMatch} links</p>
            </div>
          </div>
        </div>

        {analysis.policyViolations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
              Policy comparison
            </p>
            {analysis.policyViolations.map((pv, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="text-base">
                      {pv.severity === "error" ? "\u{1F6AB}" : "\u26A0\uFE0F"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{pv.message}</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                        <span className="font-medium">{pv.engine}</span> &mdash; {pv.policy}
                      </p>
                    </div>
                  </div>
                  <a
                    href={pv.policyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-full bg-[var(--panel-strong)] px-2.5 py-1 text-xs font-medium text-[var(--accent)] hover:underline"
                  >
                    View policy
                  </a>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-[var(--muted)]">
                  <span>Your value: <strong>{pv.currentValue}</strong></span>
                  <span className="text-[var(--border)]">|</span>
                  <span>{pv.thresholdNote}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {analysis.warnings.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
              Warnings &amp; recommendations
            </p>
            {analysis.warnings.map((w, i) => (
              <details key={i} className="group rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
                <summary className="flex cursor-pointer items-start gap-2 text-sm font-medium">
                  <span className="shrink-0 text-base">
                    {w.severity === "error" ? "\u{1F534}" : "\u26A0\uFE0F"}
                  </span>
                  <span className="flex-1">{w.message}</span>
                </summary>
                <div className="mt-2 space-y-2 pl-7">
                  <p className="text-xs text-[var(--muted)]">{w.justification}</p>
                  <p className="rounded-lg bg-[var(--panel-strong)] p-2 text-xs">{w.actionableAdvice}</p>
                </div>
              </details>
            ))}
          </div>
        )}

        {analysis.warnings.length === 0 && analysis.policyViolations.length === 0 && (
          <p className="rounded-xl bg-green-50 p-3 text-sm font-medium text-green-700">
            No issues detected. Your link profile looks natural.
          </p>
        )}
      </div>
    </section>
  );
}
