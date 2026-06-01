"use client";

import { useActionState } from "react";
import { deleteConsumerReviewAction, deleteReviewAction } from "../actions";
import type { DeleteReviewState } from "../actions";

type ConsumerReview = {
  id: string;
  rating: number;
  comment: string | null;
  displayName: string | null;
  createdAt: Date;
  vendor: { name: string };
  cohort: { name: string };
};

type FounderReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  vendor: { name: string };
  cohort: { name: string };
  user: { name: string | null; email: string | null };
};

export function AdminReviewsList({
  type,
  reviews,
}: {
  type: "consumer" | "founder";
  reviews: ConsumerReview[] | FounderReview[];
}) {
  if (reviews.length === 0) {
    return <p className="mt-4 text-sm text-[var(--muted)]">No reviews.</p>;
  }

  return (
    <div className="mt-4 space-y-2">
      {reviews.map((review) => {
        if (type === "consumer") {
          const r = review as ConsumerReview;
          return <ReviewRow key={r.id} rating={r.rating} comment={r.comment} date={r.createdAt}>
            <span className="text-xs text-[var(--muted)]">{r.vendor.name} · {r.displayName ?? "Anonymous"}</span>
            <AdminDeleteButton action={deleteConsumerReviewAction} reviewId={r.id} />
          </ReviewRow>;
        }
        const r = review as FounderReview;
        return <ReviewRow key={r.id} rating={r.rating} comment={r.comment} date={r.createdAt}>
          <span className="text-xs text-[var(--muted)]">{r.vendor.name} · {r.user.name ?? r.user.email}</span>
          <AdminDeleteButton action={deleteReviewAction} reviewId={r.id} />
        </ReviewRow>;
      })}
    </div>
  );
}

function ReviewRow({
  rating,
  comment,
  date,
  children,
}: {
  rating: number;
  comment: string | null;
  date: Date;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {children}
        </div>
        {comment ? <p className="mt-1 line-clamp-2 text-sm leading-6">{comment}</p> : null}
        <p className="mt-1 text-xs text-[var(--muted)]">
          {rating}/5 · {date.toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

function AdminDeleteButton({
  action,
  reviewId,
}: {
  action: (state: DeleteReviewState, formData: FormData) => Promise<DeleteReviewState>;
  reviewId: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="shrink-0">
      <input type="hidden" name="reviewId" value={reviewId} />
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "..." : "Delete"}
      </button>
      {state.error ? <span className="ml-2 text-xs text-red-600">{state.error}</span> : null}
    </form>
  );
}
