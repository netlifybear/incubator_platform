"use client";

import type { QualityWarning, QualityMetrics } from "@/lib/review-quality";

type QualityFeedbackPanelProps = {
  warnings: QualityWarning[];
  metrics: QualityMetrics;
  score: number;
};

const SEVERITY_ICONS: Record<string, string> = {
  error: "\u{1F534}",
  warning: "\u26A0\uFE0F",
  suggestion: "\uD83D\uDCA1",
  info: "\u2139\uFE0F",
};

const SEVERITY_LABELS: Record<string, string> = {
  error: "Required",
  warning: "Recommended",
  suggestion: "Tip",
  info: "Note",
};

function getScoreColor(score: number): string {
  if (score > 70) return "text-green-700";
  if (score >= 40) return "text-amber-700";
  return "text-red-700";
}

function getScoreBg(score: number): string {
  if (score > 70) return "bg-green-100";
  if (score >= 40) return "bg-amber-100";
  return "bg-red-100";
}

export function QualityFeedbackPanel({
  warnings,
  metrics,
  score,
}: QualityFeedbackPanelProps) {
  if (metrics.length === 0) return null;

  const errorWarnings = warnings.filter((w) => w.severity === "error");
  const otherWarnings = warnings.filter((w) => w.severity !== "error");

  return (
    <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <span className="rounded-full bg-[var(--panel-strong)] px-2.5 py-1 font-medium">
            {metrics.length} chars
          </span>
          <span className="rounded-full bg-[var(--panel-strong)] px-2.5 py-1 font-medium">
            {metrics.wordCount} words
          </span>
          <span className="rounded-full bg-[var(--panel-strong)] px-2.5 py-1 font-medium">
            {metrics.hasNumbers ? "Numbers \u2713" : "No numbers"}
          </span>
          <span className="rounded-full bg-[var(--panel-strong)] px-2.5 py-1 font-medium">
            {metrics.hasServiceMention ? "Service \u2713" : "No service mentioned"}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 font-bold ${getScoreBg(score)} ${getScoreColor(score)}`}
        >
          {score}/100
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {errorWarnings.map((w) => (
          <WarningRow key={w.ruleId} warning={w} />
        ))}
        {otherWarnings.map((w) => (
          <WarningRow key={w.ruleId} warning={w} />
        ))}
      </div>

      {warnings.length === 0 && metrics.length > 0 && (
        <p className="mt-2 font-medium text-green-700">
          Review looks good! {"\u2713"}
        </p>
      )}
    </div>
  );
}

function WarningRow({ warning }: { warning: QualityWarning }) {
  const icon = SEVERITY_ICONS[warning.severity] || "\u2139\uFE0F";
  const label = SEVERITY_LABELS[warning.severity] || "Info";

  if (warning.severity === "info") {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-white/50 p-3">
        <div className="flex items-start gap-2 text-sm font-medium">
          <span className="shrink-0">{icon}</span>
          <span className="flex-1">{warning.message}</span>
          <span className="shrink-0 rounded-full bg-[var(--panel-strong)] px-2 py-0.5 text-xs text-[var(--muted)]">
            {label}
          </span>
        </div>
        <div className="mt-2 space-y-2 pl-6">
          <p className="text-xs text-[var(--muted)]">{warning.justification}</p>
          <p className="rounded-lg bg-[var(--panel-strong)] p-2 text-xs">
            {warning.actionableAdvice}
          </p>
        </div>
      </div>
    );
  }

  return (
    <details className="group rounded-xl border border-[var(--border)] bg-white/50 p-3">
      <summary className="flex cursor-pointer items-start gap-2 text-sm font-medium">
        <span className="shrink-0">{icon}</span>
        <span className="flex-1">{warning.message}</span>
        <span className="shrink-0 rounded-full bg-[var(--panel-strong)] px-2 py-0.5 text-xs text-[var(--muted)]">
          {label}
        </span>
      </summary>
      <div className="mt-2 space-y-2 pl-6">
        <p className="text-xs text-[var(--muted)]">{warning.justification}</p>
        <p className="rounded-lg bg-[var(--panel-strong)] p-2 text-xs">
          {warning.actionableAdvice}
        </p>
      </div>
    </details>
  );
}
