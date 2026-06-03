"use client";

import { useCallback, useState } from "react";

export function ReputationPortability() {
  const [jwt, setJwt] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [importJwt, setImportJwt] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch("/api/reputation/export", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setExportError(data.error ?? "Export failed.");
        return;
      }
      setJwt(data.jwt);
    } catch {
      setExportError("Network error. Please try again.");
    } finally {
      setExporting(false);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!importJwt.trim()) return;
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const res = await fetch("/api/reputation/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jwt: importJwt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error ?? "Import failed.");
        return;
      }
      setImportResult(data.message);
      setImportJwt("");
    } catch {
      setImportError("Network error. Please try again.");
    } finally {
      setImporting(false);
    }
  }, [importJwt]);

  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        Cross-incubator credibility
      </p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight">
        Portable credibility
      </h2>
      <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
        Export your credibility packet as a signed JWT to import into another incubator instance,
        or import a JWT from another founder or past cohort.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)] bg-white/70 p-6">
          <h3 className="text-lg font-semibold">Export your credibility packet</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Generate a signed packet containing your cohort status, contribution signals,
            internal scoring, and review aggregates. Share this JWT with another incubator
            to import your credibility.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="mt-4 cursor-pointer rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? "Generating..." : "Export packet"}
          </button>
          {exportError && (
            <p className="mt-3 text-sm font-medium text-red-700">{exportError}</p>
          )}
          {jwt && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-green-700">JWT generated:</p>
              <div className="mt-2 overflow-x-auto rounded-xl bg-[var(--panel-strong)] p-3">
                <code className="break-all text-xs text-[var(--muted)]">{jwt}</code>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(jwt)}
                className="mt-3 cursor-pointer rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold"
              >
                Copy JWT
              </button>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-white/70 p-6">
          <h3 className="text-lg font-semibold">Import credibility</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Paste a JWT from another incubator instance or a previous cohort export
            to bring your credibility credentials here.
          </p>
          <textarea
            value={importJwt}
            onChange={(e) => setImportJwt(e.target.value)}
            placeholder="Paste JWT here..."
            rows={3}
            className="mt-4 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-xs"
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !importJwt.trim()}
            className="mt-3 cursor-pointer rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {importing ? "Verifying..." : "Import credibility"}
          </button>
          {importError && (
            <p className="mt-3 text-sm font-medium text-red-700">{importError}</p>
          )}
          {importResult && (
            <div className="mt-3 rounded-2xl border border-green-200 bg-green-50/70 p-4">
              <p className="text-sm font-medium text-green-800">{importResult}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
