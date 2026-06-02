import { inviteStatusLabel } from "@/lib/invite-presenter";
import { listInvitesForCohort } from "@/lib/invites";
import { prisma } from "@/lib/prisma";
import { CreateInviteForm } from "./create-invite-form";
import { RevokeInviteForm } from "./revoke-invite-form";
import { CopyInviteLink } from "@/app/components/copy-invite-link";

type InvitesSectionProps = {
  cohortId: string;
};

export async function AdminInvitesSection({ cohortId }: InvitesSectionProps) {
  const invites = await listInvitesForCohort(cohortId);

  const [totalInvites, acceptedInvites, founderReferrals] = await Promise.all([
    prisma.invite.count({ where: { cohortId } }),
    prisma.invite.count({ where: { cohortId, acceptedAt: { not: null } } }),
    prisma.invite.count({
      where: { cohortId, invitedById: { not: null }, acceptedAt: { not: null } },
    }),
  ]);

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Cohort access
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Invite founders</h2>
          <p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">
            Create single-use invite links for founders who should join this private
            cohort.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-sm font-semibold">
            {totalInvites} total
          </span>
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
            {acceptedInvites} accepted
          </span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            {founderReferrals} referred
          </span>
        </div>
      </div>
      <CreateInviteForm />
      <div className="mt-5 space-y-3">
        {invites.length === 0 ? (
          <p className="leading-7 text-[var(--muted)]">
            No invites yet. Invite links will appear here after creation.
          </p>
        ) : (
          invites.map((invite) => {
            const status = inviteStatusLabel(invite);

            return (
              <article
                key={invite.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{invite.email}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {invite.invitedBy ? (
                        <>Referred by {invite.invitedBy.name ?? invite.invitedBy.email} · </>
                      ) : null}
                      Expires{" "}
                      {invite.expiresAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                    {status}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <p className="font-mono text-xs text-[var(--muted)]">
                    /invite/{invite.token}
                  </p>
                  {status === "Open" ? <CopyInviteLink token={invite.token} /> : null}
                </div>
                {status === "Open" ? <RevokeInviteForm inviteId={invite.id} /> : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export function InvitesFallback() {
  return (
    <section className="animate-pulse rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="h-4 w-28 rounded-full bg-[var(--panel-strong)]" />
      <div className="mt-3 h-7 w-48 rounded-full bg-[var(--panel-strong)]" />
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="h-12 rounded-2xl bg-[var(--panel-strong)]" />
        <div className="h-12 w-32 rounded-full bg-[var(--panel-strong)]" />
      </div>
    </section>
  );
}
