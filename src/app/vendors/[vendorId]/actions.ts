"use server";

import { revalidatePath } from "next/cache";
import { getCurrentFounder } from "@/lib/auth";
import { createReviewForCohort } from "@/lib/reviews";
import { createConsumerReview } from "@/lib/consumer-reviews";
import { getFounderPoints, getFounderCohortRank } from "@/lib/points";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { toggleVote } from "@/lib/helpful-votes";
import { reviewCelebrationPoints } from "@/lib/review-action-presenter";
import { analyzeReviewText } from "@/lib/review-quality";
import { createTargetedVendorRequest } from "@/lib/vendor-requests";
import founderRules from "@/config/review-rules-founder.json" with { type: "json" };
import { put } from "@vercel/blob";

export type ReviewActionState = {
  error?: string;
  success?: string;
  celebration?: {
    pointsEarned: number;
    newTotal: number;
    rank: { rank: number; total: number } | null;
  };
};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

async function uploadImages(formData: FormData): Promise<string[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return [];
  }

  const entries = Array.from(formData.entries()).filter(([key]) => key.startsWith("image-"));
  const urls: string[] = [];

  for (const [, value] of entries) {
    if (!(value instanceof File) || value.size === 0) continue;
    if (!ALLOWED_IMAGE_TYPES.includes(value.type)) continue;
    if (value.size > MAX_IMAGE_SIZE) continue;

    const ext = value.name.split(".").pop() ?? "jpg";
    const filename = `reviews/${crypto.randomUUID()}.${ext}`;
    try {
      const blob = await put(filename, value, { access: "public" });
      urls.push(blob.url);
    } catch {
      // Keep review submission working if optional image upload is unavailable.
    }
  }

  return urls;
}

export async function createReviewAction(
  vendorId: string,
  mode: string,
  _state: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const founder = await getCurrentFounder();

  if (!founder) {
    return { error: "You must be signed in to create a founder review." };
  }

  if (!hasActiveCohort(founder)) {
    return { error: "You must be signed in as a cohort founder to review vendors." };
  }

  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "");
  const usedVendor = formData.get("usedVendor") === "on";
  const workType = String(formData.get("workType") ?? "");
  const disclosedIncentive = formData.get("disclosedIncentive") === "on";

  if (mode === "founder") {
    const analysis = analyzeReviewText(comment, founderRules as Parameters<typeof analyzeReviewText>[1], disclosedIncentive);
    const errors = analysis.warnings.filter((w) => w.severity === "error");
    if (errors.length > 0) {
      return { error: errors[0].message };
    }
  }

  const images = await uploadImages(formData);

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
      images,
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
  revalidatePath("/badges");
  return {
    success: "Review added. Your reputation grows.",
    celebration: { pointsEarned: reviewCelebrationPoints(comment), newTotal: points.total, rank },
  };
}

export type VoteActionState = {
  count: number;
  voted: boolean;
};

export type AskForDetailsState = {
  error?: string;
  success?: boolean;
};

export async function askForDetailsAction(
  vendorCategory: string,
  vendorName: string,
  _vendorId: string,
  cohortId: string,
  founderId: string,
  targetUserId: string,
  _state: AskForDetailsState,
  formData: FormData,
): Promise<AskForDetailsState> {
  const founder = await getCurrentFounder();
  if (!founder || founder.id !== founderId) {
    return { error: "You must be signed in." };
  }

  const message = String(formData.get("message") ?? "").trim();
  if (message.length < 2) {
    return { error: "Message must be at least 2 characters." };
  }

  try {
    await createTargetedVendorRequest({
      cohortId,
      userId: founderId,
      targetUserId,
      category: vendorCategory,
      description: `Asked about ${vendorName}`,
      message,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not send request." };
  }

  revalidatePath(`/vendors/${_vendorId}`);
  return { success: true };
}

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

export async function createConsumerReviewAction(
  vendorId: string,
  cohortId: string,
  _state: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim() || undefined;

  if (rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5." };
  }

  const images = await uploadImages(formData);

  try {
    await createConsumerReview({ vendorId, cohortId, rating, comment: comment || null, displayName: displayName || null, images });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create review." };
  }

  revalidatePath(`/vendors/${vendorId}`);
  return { success: "Review added. Thank you!" };
}
