import { redirect } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort, canWriteToCohort } from "@/lib/tenant-policy";
import { getFounderReferralStats } from "@/lib/invites";
import { FounderInviteForm } from "./invite-form";

export default async function InvitePage() {
  const founder = await getCurrentFounder();

  if (!founder) {
    redirect("/signin");
  }

  if (!hasActiveCohort(founder) || !founder.cohort) {
    redirect("/");
  }

  const referralStats = founder ? await getFounderReferralStats(founder.id) : null;

  return (
    <AppShell founder={founder} cohortName={founder.cohort.name}>
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Invite
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Invite a founder
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Invite another founder to join your cohort. They&apos;ll get a magic link
          to sign in and start contributing reviews.
        </p>

        {!canWriteToCohort(founder) ? (
          <div className="mt-6 rounded-3xl border border-[var(--border)] bg-amber-50 p-6">
            <p className="text-sm font-semibold text-amber-800">
              Alumni cannot create invites.
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <FounderInviteForm />
          </div>
        )}
      </section>

      {referralStats ? (
        <section className="mt-6 rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Your referrals</h2>
          <div className="mt-4 flex gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                Invites sent
              </p>
              <p className="mt-1 text-3xl font-semibold">{referralStats.sent}</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                Joined
              </p>
              <p className="mt-1 text-3xl font-semibold">{referralStats.accepted}</p>
            </div>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
