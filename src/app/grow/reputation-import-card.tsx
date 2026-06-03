"use client";

import { useState } from "react";

export function ReputationImportCard() {
  const [importJwt, setImportJwt] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showImportForm, setShowImportForm] = useState(false);

  async function handleImport() {
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
      setShowImportForm(false);
    } catch {
      setImportError("Network error. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowImportForm((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm font-semibold transition hover:border-[var(--accent)]"
      >
        <div className="text-left">
          <p className="text-sm font-semibold">Import your credibility</p>
          <p className="text-xs text-[var(--muted)]">Upload a JWT from another incubator</p>
        </div>
        <span className="text-sm text-[var(--accent)]">-&gt;</span>
      </button>

      {showImportForm ? (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-white/70 p-4">
          <p className="text-sm font-medium text-[var(--muted)]">Import credibility JWT</p>
          <textarea
            value={importJwt}
            onChange={(e) => setImportJwt(e.target.value)}
            placeholder="Paste JWT here..."
            rows={2}
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-xs"
          />
          {importError ? <p className="mt-2 text-sm font-medium text-red-700">{importError}</p> : null}
          {importResult ? (
            <div className="mt-2 rounded-2xl border border-green-200 bg-green-50/70 p-2">
              <p className="text-sm font-medium text-green-800">{importResult}</p>
            </div>
          ) : null}
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || !importJwt.trim()}
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing ? "Importing..." : "Import credibility"}
            </button>
            <button
              type="button"
              onClick={() => {
                setImportJwt("");
                setImportError(null);
                setImportResult(null);
                setShowImportForm(false);
              }}
              className="px-4 py-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--accent)]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
