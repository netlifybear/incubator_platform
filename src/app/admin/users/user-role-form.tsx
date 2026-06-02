"use client";

import { useActionState } from "react";
import { graduateToAlumniAction, restoreFounderAction } from "@/app/admin/actions";

const initialState = { error: undefined, success: undefined };

type Props = {
  userId: string;
  action: "graduate" | "restore";
};

export function UserRoleForm({ userId, action }: Props) {
  const [state, formAction, isPending] = useActionState(
    action === "graduate" ? graduateToAlumniAction : restoreFounderAction,
    initialState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={isPending}
        className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
          action === "graduate"
            ? "bg-[var(--accent)] text-white hover:opacity-90"
            : "border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
        } disabled:opacity-50`}
      >
        {action === "graduate" ? "Graduate to alumni" : "Restore to founder"}
      </button>
      {state?.error ? (
        <p className="mt-1 text-xs text-red-600">{state.error}</p>
      ) : state?.success ? (
        <p className="mt-1 text-xs text-green-600">{state.success}</p>
      ) : null}
    </form>
  );
}
