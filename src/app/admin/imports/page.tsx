import { notFound } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ImportApprovalForm } from "./import-approval-form";

export default async function AdminImportsPage() {
  const admin = await getCurrentAdmin();

  if (!admin?.cohortId || !admin.cohort) {
    notFound();
  }

  const cohort = await prisma.cohort.findUnique({
    where: { id: admin.cohortId },
    select: { defaultTrustPolicy: true },
  });
  const defaultTrustPolicy = cohort?.defaultTrustPolicy ?? "all";

  const pendingImports = await prisma.reputationImport.findMany({
    where: {
      user: { cohortId: admin.cohortId },
      status: "pending",
    },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { importedAt: "desc" },
  });

  const historyImports = await prisma.reputationImport.findMany({
    where: {
      user: { cohortId: admin.cohortId },
      status: { in: ["approved", "rejected"] },
    },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { approvedAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Imports
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Reputation Import Queue
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Review and approve reputation imports submitted by founders. Each import
          defaults to the cohort&apos;s trust policy (currently{" "}
          <span className="font-semibold">{defaultTrustPolicy}</span>), but you can
          override per import.
        </p>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Pending approval
          {pendingImports.length > 0 ? (
            <span className="ml-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-sm font-bold text-white">
              {pendingImports.length}
            </span>
          ) : null}
        </h2>

        {pendingImports.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">No pending imports.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {pendingImports.map((imp) => {
              let packet: { sourceIncubator?: { name: string }; aggregates?: { totalPoints?: number; totalBadges?: number; totalReviews?: number }; attestations?: Array<{ type: string; label: string }> } | null = null;
              try { packet = JSON.parse(imp.packetJson); } catch { /* skip */ }

              const badgeAttestations = packet?.attestations?.filter((a) => a.type.startsWith("badge_")) ?? [];

              return (
                <div key={imp.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{imp.user.name ?? imp.user.email}</p>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          From: {imp.sourceName}
                        </span>
                      </div>
                      {packet?.aggregates ? (
                        <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
                          <span>{packet.aggregates.totalReviews ?? 0} reviews</span>
                          <span>{packet.aggregates.totalBadges ?? 0} badges</span>
                          <span>{packet.aggregates.totalPoints ?? 0} pts</span>
                        </div>
                      ) : null}
                      {badgeAttestations.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {badgeAttestations.map((b, i) => (
                            <span key={i} className="rounded-full bg-[var(--panel-strong)] px-2 py-0.5 text-xs text-[var(--muted)]">
                              {b.label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <p className="text-xs text-[var(--muted)]">
                        Submitted {imp.importedAt.toLocaleDateString()} &middot; Source ID: {imp.sourceInstance.slice(0, 12)}...
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <ImportApprovalForm importId={imp.id} defaultTrustPolicy={defaultTrustPolicy} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {historyImports.length > 0 ? (
        <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
          <h2 className="text-xl font-semibold">History</h2>
          <div className="mt-4 space-y-2">
            {historyImports.map((imp) => {
              const isApproved = imp.status === "approved";
              return (
                <div key={imp.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isApproved ? "text-green-700" : "text-red-700"}`}>
                        {isApproved ? "Approved" : "Rejected"}
                      </span>
                      <span className="text-sm text-[var(--muted)]">{imp.user.name ?? imp.user.email}</span>
                      <span className="text-xs text-[var(--muted)]">from {imp.sourceName}</span>
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      {imp.approvedAt?.toLocaleDateString()} by {imp.approvedBy}
                      {!isApproved && imp.rejectionReason ? ` — ${imp.rejectionReason}` : ""}
                      {isApproved ? ` (policy: ${imp.trustPolicy})` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
