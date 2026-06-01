import {
  normalizeReviewComment,
  normalizeReviewWorkType,
  validateReviewRating,
} from "@/lib/review-validation";
import { prisma } from "@/lib/prisma";

export type CreateReviewInput = {
  vendorId: string;
  userId: string;
  cohortId: string;
  rating: number;
  comment: string;
  usedVendor: boolean;
  workType: string;
  disclosedIncentive?: boolean;
};

export async function createReviewForCohort(input: CreateReviewInput) {
  const vendor = await prisma.vendor.findFirst({
    where: {
      id: input.vendorId,
      cohortId: input.cohortId,
    },
    select: {
      id: true,
    },
  });

  if (!vendor) {
    throw new Error("Vendor not found for this cohort.");
  }

  validateReviewRating(input.rating);
  const comment = normalizeReviewComment(input.comment);
  const workType = normalizeReviewWorkType(input.workType);

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        vendorId: input.vendorId,
        userId: input.userId,
        cohortId: input.cohortId,
        rating: input.rating,
        comment,
        usedVendor: input.usedVendor,
        workType,
        disclosedIncentive: input.disclosedIncentive ?? false,
      },
    });

    await tx.user.update({
      where: { id: input.userId },
      data: { lastReviewDate: new Date() },
    });

    return review;
  });
}
