"use client";

import { useActionState } from "react";
import { toggleHelpfulVote } from "@/app/vendors/[vendorId]/actions";
import type { VoteActionState } from "@/app/vendors/[vendorId]/actions";

type HelpfulVoteButtonProps = {
  reviewId: string;
  userId: string;
  vendorId: string;
  initialUp: number;
  initialDown: number;
  initialUserVote: boolean | null;
};

export function HelpfulVoteButton({
  reviewId,
  userId,
  vendorId,
  initialUp,
  initialDown,
  initialUserVote,
}: HelpfulVoteButtonProps) {
  const initialState: VoteActionState = {
    count: initialUp - initialDown,
    voted: initialUserVote !== null,
  };

  const toggleUp = toggleHelpfulVote.bind(null, reviewId, userId, true);
  const toggleDown = toggleHelpfulVote.bind(null, reviewId, userId, false);

  const [upState, upAction, upPending] = useActionState(toggleUp, initialState);
  const [downState, downAction, downPending] = useActionState(toggleDown, initialState);

  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      <form action={upAction}>
        <input type="hidden" name="vendorId" value={vendorId} />
        <button
          type="submit"
          disabled={upPending}
          className={`flex items-center gap-1 rounded-full px-3 py-1 font-medium cursor-pointer ${
            upState.voted
              ? "bg-green-100 text-green-800"
              : "bg-[var(--panel-strong)] text-[var(--muted)] hover:bg-green-50 hover:text-green-700"
          }`}
        >
          {"\u{1F44D}"} {upState.count}
        </button>
      </form>
      <form action={downAction}>
        <input type="hidden" name="vendorId" value={vendorId} />
        <button
          type="submit"
          disabled={downPending}
          className={`flex items-center gap-1 rounded-full px-3 py-1 font-medium cursor-pointer ${
            downState.voted
              ? "bg-red-100 text-red-800"
              : "bg-[var(--panel-strong)] text-[var(--muted)] hover:bg-red-50 hover:text-red-700"
          }`}
        >
          {"\u{1F44E}"} {downState.count}
        </button>
      </form>
    </div>
  );
}
