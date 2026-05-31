"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  importGscLinksAction,
  disconnectGscAction,
  type GscImportState,
} from "./gsc-actions";

const initialImportState: GscImportState = {};
const initialDisconnectState: GscImportState = {};

export function GscSection({
  gscConnected,
  gscEmail,
}: {
  gscConnected: boolean;
  gscEmail: string | null;
}) {
  const searchParams = useSearchParams();
  const gscParam = searchParams.get("gsc");

  const [importState, importAction, importPending] = useActionState(
    importGscLinksAction,
    initialImportState,
  );

  const [disconnectState, disconnectAction, disconnectPending] = useActionState(
    disconnectGscAction,
    initialDisconnectState,
  );

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Google Search Console</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {gscConnected
              ? `Connected as ${gscEmail ?? "unknown"}`
              : "Connect your Google account to automatically discover referring domains."}
          </p>
        </div>
        {gscConnected ? (
          <div className="flex items-center gap-2">
            <form action={importAction}>
              <button
                type="submit"
                disabled={importPending}
                className="cursor-pointer rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {importPending ? "Importing..." : "Import links"}
              </button>
            </form>
            <form action={disconnectAction}>
              <button
                type="submit"
                disabled={disconnectPending}
                className="cursor-pointer rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                Disconnect
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/api/auth/gsc"
            className="inline-block cursor-pointer rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Connect GSC
          </Link>
        )}
      </div>

      {importState.success && (
        <p className="mt-4 text-sm text-green-600">{importState.success}</p>
      )}
      {importState.error && (
        <p className="mt-4 text-sm text-red-600">{importState.error}</p>
      )}
      {importState.sites && importState.sites.length > 0 && (
        <div className="mt-3 space-y-1">
          {importState.sites.map((s) => (
            <p key={s.siteUrl} className="text-sm text-[var(--muted)]">
              {s.siteUrl}: {s.imported} imported, {s.skipped} already tracked
            </p>
          ))}
        </div>
      )}

      {disconnectState.success && (
        <p className="mt-4 text-sm text-green-600">{disconnectState.success}</p>
      )}
      {disconnectState.error && (
        <p className="mt-4 text-sm text-red-600">{disconnectState.error}</p>
      )}

      {gscParam === "connected" && (
        <p className="mt-4 text-sm text-green-600">
          Google Search Console connected successfully. Click &quot;Import links&quot; to fetch your referring domains.
        </p>
      )}
      {gscParam === "error" && (
        <p className="mt-4 text-sm text-red-600">
          Could not connect Google Search Console. Please try again.
        </p>
      )}
      {gscParam === "noconfig" && (
        <p className="mt-4 text-sm text-amber-600">
          Google OAuth is not configured. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in your environment.
        </p>
      )}
    </section>
  );
}
