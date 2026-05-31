import Link from "next/link";
import { getFounderDisplayName } from "@/lib/tenant-policy";
import {
  closedRequestLabel,
  fulfilledRequestLabel,
  requestCountLabel,
} from "@/lib/vendor-request-presenter";
import {
  listAdminVendorRequestsForCohort,
  listClosedVendorRequestsForCohort,
  listFulfilledVendorRequestsForCohort,
} from "@/lib/vendor-requests";
import { EditRequestForm } from "./edit-request-form";
import { FulfillRequestForm } from "./fulfill-request-form";
import { CloseRequestForm } from "./close-request-form";

type OpenRequestsSectionProps = {
  cohortId: string;
};

export async function AdminOpenRequestsSection({ cohortId }: OpenRequestsSectionProps) {
  const requests = await listAdminVendorRequestsForCohort(cohortId);

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-2xl font-semibold">Open requests</h2>
        <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-sm font-semibold">
          {requestCountLabel(requests.length)}
        </span>
      </div>
      <div className="mt-5 space-y-4">
        {requests.length === 0 ? (
          <p className="leading-7 text-[var(--muted)]">
            No open requests right now. The cohort memory layer is breathing calmly.
          </p>
        ) : (
          requests.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                    {request.category}
                  </p>
                  <p className="mt-2 leading-7">{request.description}</p>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {getFounderDisplayName(request.user)}
                </p>
              </div>
              <EditRequestForm
                requestId={request.id}
                category={request.category}
                description={request.description}
              />
              <FulfillRequestForm requestId={request.id} />
              <CloseRequestForm requestId={request.id} />
            </article>
          ))
        )}
      </div>
    </section>
  );
}

type FulfilledRequestsSectionProps = {
  cohortId: string;
};

export async function AdminFulfilledRequestsSection({ cohortId }: FulfilledRequestsSectionProps) {
  const fulfilledRequests = await listFulfilledVendorRequestsForCohort(cohortId);

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-2xl font-semibold">Fulfilled requests</h2>
        <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-sm font-semibold">
          {fulfilledRequests.length} fulfilled
        </span>
      </div>
      <div className="mt-5 space-y-4">
        {fulfilledRequests.length === 0 ? (
          <p className="leading-7 text-[var(--muted)]">
            Fulfilled requests will appear here after admins convert them into
            vendors.
          </p>
        ) : (
          fulfilledRequests.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                    {request.category}
                  </p>
                  <p className="mt-2 leading-7">{request.description}</p>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    Requested by {getFounderDisplayName(request.user)}
                    {request.fulfilledAt
                      ? `, fulfilled ${request.fulfilledAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}`
                      : ""}
                  </p>
                </div>
                {request.fulfilledVendor ? (
                  <Link
                    href={`/vendors/${request.fulfilledVendor.id}`}
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    {fulfilledRequestLabel(request.fulfilledVendor.name)}
                  </Link>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

type ClosedRequestsSectionProps = {
  cohortId: string;
};

export async function AdminClosedRequestsSection({ cohortId }: ClosedRequestsSectionProps) {
  const closedRequests = await listClosedVendorRequestsForCohort(cohortId);

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-2xl font-semibold">Closed requests</h2>
        <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-sm font-semibold">
          {closedRequests.length} closed
        </span>
      </div>
      <div className="mt-5 space-y-4">
        {closedRequests.length === 0 ? (
          <p className="leading-7 text-[var(--muted)]">
            Closed requests will appear here when admins decide not to create a
            vendor.
          </p>
        ) : (
          closedRequests.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                    {request.category}
                  </p>
                  <p className="mt-2 leading-7">{request.description}</p>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    Requested by {getFounderDisplayName(request.user)}, closed{" "}
                    {request.updatedAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-3 text-sm font-medium text-[var(--accent-strong)]">
                    {closedRequestLabel(request.adminNote)}
                  </p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

