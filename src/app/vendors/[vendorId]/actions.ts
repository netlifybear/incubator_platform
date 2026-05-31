"use server";

import { revalidatePath } from "next/cache";
import { getCurrentFounder } from "@/lib/auth";
import { createReviewForCohort } from "@/lib/reviews";
import { getFounderPoints, getFounderCohortRank } from "@/lib/points";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { toggleVote } from "@/lib/helpful-votes";
import { reviewCelebrationPoints } from "@/lib/review-action-presenter";

export type ReviewActionState = {
  error?: string;
  success?: string;
  celebration?: {
    pointsEarned: number;
    newTotal: number;
    rank: { rank: number; total: number } | null;
  };
};

export async function createReviewAction(
  vendorId: string,
  _state: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const founder = await getCurrentFounder();

  if (!hasActiveCohort(founder)) {
    return { error: "You must be signed in as a cohort founder to review vendors." };
  }

  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "");
  const usedVendor = formData.get("usedVendor") === "on";
  const workType = String(formData.get("workType") ?? "");
  const disclosedIncentive = formData.get("disclosedIncentive") === "on";

  try {
    await createReviewForCohort({
      vendorId,
      userId: founder.id,
      cohortId: founder.cohortId,
      rating,
      comment,
      usedVendor,
      workType,
      disclosedIncentive,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create review.",
    };
  }

  const [points, rank] = await Promise.all([
    getFounderPoints(founder.id),
    getFounderCohortRank(founder.id, founder.cohortId),
  ]);

  revalidatePath("/");
  revalidatePath(`/vendors/${vendorId}`);
  return {
    success: "Review added. Your reputation grows.",
    celebration: { pointsEarned: reviewCelebrationPoints(comment), newTotal: points.total, rank },
  };
}

export type VoteActionState = {
  count: number;
  voted: boolean;
};

export async function toggleHelpfulVote(
  reviewId: string,
  userId: string,
  value: boolean,
  _prevState: VoteActionState,
  _formData: FormData,
): Promise<VoteActionState> {
  const founder = await getCurrentFounder();
  if (!founder || founder.id !== userId || !founder.cohortId) {
    return { count: 0, voted: false };
  }

  const result = await toggleVote({ reviewId, userId, cohortId: founder.cohortId, value });
  revalidatePath("/");
  revalidatePath(`/vendors/${_formData.get("vendorId")}`);
  return result;
}
