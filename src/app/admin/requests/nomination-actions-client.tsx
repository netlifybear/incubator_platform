"use client";

import { useActionState } from "react";
import {
  approveNominationAction,
  rejectNominationAction,
  type AdminNominationActionState,
} from "./nomination-actions";

type Props = {
  nominationId: string;
};

const approveInitial: AdminNominationActionState = {};
const rejectInitial: AdminNominationActionState = {};

function ApproveForm({ nominationId }: Props) {
  const action = approveNominationAction.bind(null, nominationId);
  const [state, formAction, pending] = useActionState(action, approveInitial);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
      >
        {pending ? "Approving..." : "Approve"}
      </button>
      {state.success && (
        <span className="text-xs text-green-700">{state.success}</span>
      )}
      {state.error && (
        <span className="text-xs text-red-700">{state.error}</span>
      )}
    </form>
  );
}

function RejectForm({ nominationId }: Props) {
  const action = rejectNominationAction.bind(null, nominationId);
  const [state, formAction, pending] = useActionState(action, rejectInitial);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Rejecting..." : "Reject"}
      </button>
      {state.success && (
        <span className="text-xs text-green-700">{state.success}</span>
      )}
      {state.error && (
        <span className="text-xs text-red-700">{state.error}</span>
      )}
    </form>
  );
}

function ApproveWithNoteForm({ nominationId }: Props) {
  const action = approveNominationAction.bind(null, nominationId);
  const [state, formAction, pending] = useActionState(action, approveInitial);

  return (
    <form action={formAction} className="flex flex-1 gap-2">
      <input
        name="reviewerNote"
        className="flex-1 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
        placeholder="Optional note..."
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
      >
        {pending ? "..." : "Approve"}
      </button>
      {state.error && (
        <span className="text-xs text-red-700">{state.error}</span>
      )}
    </form>
  );
}

function RejectWithNoteForm({ nominationId }: Props) {
  const action = rejectNominationAction.bind(null, nominationId);
  const [state, formAction, pending] = useActionState(action, rejectInitial);

  return (
    <form action={formAction} className="flex flex-1 gap-2">
      <input
        name="reviewerNote"
        className="flex-1 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
        placeholder="Optional note..."
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "..." : "Reject"}
      </button>
      {state.error && (
        <span className="text-xs text-red-700">{state.error}</span>
      )}
    </form>
  );
}

export { ApproveForm, RejectForm, ApproveWithNoteForm, RejectWithNoteForm };
