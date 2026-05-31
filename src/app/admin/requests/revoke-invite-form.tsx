"use client";

import { useActionState } from "react";
import { revokeInviteAction, type RevokeInviteActionState } from "./actions";

type RevokeInviteFormProps = {
  inviteId: string;
};

const initialState: RevokeInviteActionState = {};

export function RevokeInviteForm({ inviteId }: RevokeInviteFormProps) {
  const action = revokeInviteAction.bind(null, inviteId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Revoking..." : "Revoke invite"}
      </button>
      {state.error ? <p className="text-xs font-medium text-red-700">{state.error}</p> : null}
      {state.success ? (
        <p className="text-xs font-medium text-[var(--accent)]">{state.success}</p>
      ) : null}
    </form>
  );
}
