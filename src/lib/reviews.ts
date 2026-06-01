import {
  normalizeReviewComment,
  normalizeReviewWorkType,
  validateReviewRating,
} from "@/lib/review-validation";
import { prisma } from "@/lib/prisma";
import { recordActivity } from "@/lib/activity";
import { computeAndAwardBadges } from "@/lib/badges";

export type CreateReviewInput = {
  vendorId: string;
  userId: string;
  cohortId: string;
  rating: number;
  comment: string;
  usedVendor: boolean;
  workType: string;
  disclosedIncentive?: boolean;
  images?: string[];
};

export async function createReviewForCohort(input: CreateReviewInput) {
  const vendor = await prisma.vendor.findFirst({
    where: {
      id: input.vendorId,
      cohortId: input.cohortId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!vendor) {
    throw new Error("Vendor not found for this cohort.");
  }

  validateReviewRating(input.rating);
  const comment = normalizeReviewComment(input.comment);
  const workType = normalizeReviewWorkType(input.workType);

  const review = await prisma.$transaction(async (tx) => {
    const r = await tx.review.create({
      data: {
        vendorId: input.vendorId,
        userId: input.userId,
        cohortId: input.cohortId,
        rating: input.rating,
        comment,
        usedVendor: input.usedVendor,
        workType,
        disclosedIncentive: input.disclosedIncentive ?? false,
        images: input.images ?? [],
      },
    });

    await tx.user.update({
      where: { id: input.userId },
      data: { lastReviewDate: new Date() },
    });

    return r;
  });

  recordActivity({
    userId: input.userId,
    cohortId: input.cohortId,
    type: "review_written",
    metadata: { vendorName: vendor.name },
  }).catch(() => {});

  computeAndAwardBadges(input.userId).catch(() => {});

  return review;
}
