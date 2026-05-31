import Link from "next/link";
import { notFound } from "next/navigation";
import { inviteStatusLabel } from "@/lib/invite-presenter";
import { getInviteByToken } from "@/lib/invites";
import { acceptInviteAction } from "./actions";

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) {
    notFound();
  }

  const isAccepted = Boolean(invite.acceptedAt);
  const isExpired = invite.expiresAt < new Date();
  const isRevoked = Boolean(invite.revokedAt);
  const action = acceptInviteAction.bind(null, invite.token);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-10">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Cohort invite
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Join {invite.cohort.name}.
        </h1>
        <p className="mt-4 leading-7 text-[var(--muted)]">
          This invite is for <span className="font-semibold">{invite.email}</span>.
          Accepting it will attach that founder account to the private cohort.
        </p>

        {isRevoked ? (
          <div className="mt-6 rounded-2xl bg-[var(--panel-strong)] p-5">
            <p className="font-semibold">This invite has been revoked.</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Ask the incubator admin to create a fresh invite if access is still
              needed.
            </p>
          </div>
        ) : isAccepted ? (
          <div className="mt-6 rounded-2xl bg-[var(--panel-strong)] p-5">
            <p className="font-semibold">This invite has already been accepted.</p>
            <Link
              href="/signin"
              className="mt-4 inline-flex rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white"
            >
              Go to sign in
            </Link>
          </div>
        ) : isExpired ? (
          <div className="mt-6 rounded-2xl bg-[var(--panel-strong)] p-5">
            <p className="font-semibold">This invite has expired.</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Ask the incubator admin to create a fresh invite.
            </p>
          </div>
        ) : (
          <form action={action} className="mt-6">
            <button
              type="submit"
              className="rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white"
            >
              Accept invite
            </button>
          </form>
        )}
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Status: {inviteStatusLabel(invite)}
        </p>
      </section>
    </main>
  );
}
