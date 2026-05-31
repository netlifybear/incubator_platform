import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { prisma } from "@/lib/prisma";
import { getSentRequests, getReceivedRequests } from "@/lib/guest-posts";
import { NewExchangeForm } from "./new-exchange-form";
import { ExchangeActions } from "./exchange-actions";

export default async function ExchangesPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    redirect("/");
  }

  const cohortFounders = await prisma.user.findMany({
    where: { cohortId: founder.cohort.id, role: "founder", id: { not: founder.id } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const [sent, received] = await Promise.all([
    getSentRequests(founder.id, founder.cohort.id),
    getReceivedRequests(founder.id, founder.cohort.id),
  ]);

  const allExchanges = [...received, ...sent].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Exchanges
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Guest post exchange.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Propose and manage guest posts with other founders in your cohort.
          Writing for another founder&apos;s blog builds cross-promotional content
          and strengthens the cohort network.
        </p>
      </section>

      <NewExchangeForm founders={cohortFounders} />

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          All exchanges
          {allExchanges.length > 0 && (
            <span className="ml-2 text-sm font-normal text-[var(--muted)]">
              ({allExchanges.length})
            </span>
          )}
        </h2>

        {allExchanges.length === 0 ? (
          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            No exchange requests yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {allExchanges.map((exchange) => {
              const isRecipient = exchange.recipientId === founder.id;
              const other = isRecipient ? exchange.requester : exchange.recipient;

              return (
                <div
                  key={exchange.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold">{exchange.topic}</p>
                      <p className="mt-0.5 text-sm text-[var(--muted)]">
                        {isRecipient
                          ? `Request from ${other.name ?? other.email}`
                          : `Request to ${other.name ?? other.email}`}
                      </p>
                      {exchange.message && (
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          {exchange.message}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={exchange.status} />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-[var(--muted)]">
                      {exchange.updatedAt.toLocaleDateString()}
                    </span>
                    {isRecipient && exchange.status === "pending" && (
                      <ExchangeActions exchangeId={exchange.id} />
                    )}
                    {isRecipient && exchange.status === "accepted" && (
                      <ExchangeActions
                        exchangeId={exchange.id}
                        status="accepted"
                      />
                    )}
                  </div>

                  {exchange.publishedUrl && (
                    <p className="mt-2 text-sm">
                      Published:{" "}
                      <a
                        href={exchange.publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] underline"
                      >
                        {exchange.publishedUrl}
                      </a>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    accepted: "bg-blue-100 text-blue-800",
    published: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
        colors[status] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
}
