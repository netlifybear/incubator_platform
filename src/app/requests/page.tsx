import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import {
  closedRequestLabel,
  founderRequestActionLabel,
  requestCountLabel,
  requestStatusLabel,
} from "@/lib/vendor-request-presenter";
import { listFounderVendorRequests, listIncomingTargetedRequests } from "@/lib/vendor-requests";

export default async function FounderRequestsPage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    return (
      <AppShell founder={founder}>
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Cohort needed
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Requests become useful once you are attached to a cohort.
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
            Ask an incubator admin for an invite before creating or tracking private
            vendor recommendation requests.
          </p>
        </section>
      </AppShell>
    );
  }

  const [requests, incomingTargeted] = await Promise.all([
    listFounderVendorRequests(founder.id, founder.cohortId),
    listIncomingTargetedRequests(founder.id),
  ]);

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          My requests
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Track the vendor recommendations you asked the cohort to find.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Open requests are waiting for an incubator admin match. Fulfilled requests
          link directly to the vendor that was added for you.
        </p>
      </section>

      {incomingTargeted.length > 0 ? (
        <section className="rounded-3xl border border-[var(--border)] bg-amber-50/70 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h2 className="text-2xl font-semibold">Incoming questions</h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
              {incomingTargeted.length} open
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Other founders have asked you for more details about your vendor experience.
          </p>
          <div className="mt-5 space-y-4">
            {incomingTargeted.map((request) => (
              <article
                key={request.id}
                className="rounded-2xl border border-[var(--border)] bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                      {request.category}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--accent-strong)]">
                      From: {request.user.name ?? request.user.email}
                    </p>
                    <p className="mt-1 leading-7">{request.description}</p>
                    {request.message ? (
                      <p className="mt-3 rounded-xl bg-[var(--panel)] p-3 text-sm leading-6 italic text-[var(--muted)]">
                        &ldquo;{request.message}&rdquo;
                      </p>
                    ) : null}
                    <p className="mt-3 text-sm text-[var(--muted)]">
                      {request.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="text-2xl font-semibold">Request history</h2>
          <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-sm font-semibold">
            {requestCountLabel(requests.filter((request) => request.status === "open").length)}
          </span>
        </div>
        <div className="mt-5 space-y-4">
          {requests.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
              <p className="text-xl font-semibold">No requests yet.</p>
              <p className="mt-2 leading-7 text-[var(--muted)]">
                When the directory is missing a vendor category you need, create a
                request from the home page and track it here.
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                Browse vendors
              </Link>
            </div>
          ) : (
            requests.map((request) => (
              <article
                key={request.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                      {request.category}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">
                      {requestStatusLabel(request.status)}
                    </h3>
                    <p className="mt-3 leading-7">{request.description}</p>
                    <p className="mt-3 text-sm text-[var(--muted)]">
                      Requested{" "}
                      {request.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {request.fulfilledAt
                        ? `, fulfilled ${request.fulfilledAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`
                        : ""}
                      {request.status === "closed"
                        ? `, closed ${request.updatedAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`
                        : ""}
                    </p>
                    {request.status === "closed" ? (
                      <p className="mt-3 text-sm font-medium text-[var(--accent-strong)]">
                        {closedRequestLabel(request.adminNote)}
                      </p>
                    ) : null}
                  </div>
                  {request.fulfilledVendor ? (
                    <Link
                      href={`/vendors/${request.fulfilledVendor.id}`}
                      className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      {founderRequestActionLabel(
                        request.status,
                        request.fulfilledVendor.name,
                      )}
                    </Link>
                  ) : (
                    <span className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]">
                      {founderRequestActionLabel(request.status)}
                    </span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
