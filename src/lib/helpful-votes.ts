import { sendNotificationEmail } from "./email.ts";
import { prisma } from "./prisma.ts";
import { createNotification } from "./notifications.ts";

export async function toggleVote(params: {
  reviewId: string;
  userId: string;
  cohortId: string;
  value: boolean;
}) {
  const reviewForVote = await prisma.review.findUnique({
    where: { id: params.reviewId },
    select: { cohortId: true, userId: true },
  });

  if (!reviewForVote || reviewForVote.cohortId !== params.cohortId) {
    throw new Error("Review not found in your cohort.");
  }

  if (reviewForVote.userId === params.userId) {
    throw new Error("You cannot vote on your own review.");
  }

  const existing = await prisma.helpfulVote.findUnique({
    where: { reviewId_userId: { reviewId: params.reviewId, userId: params.userId } },
  });

  if (existing) {
    if (existing.value === params.value) {
      await prisma.helpfulVote.delete({ where: { id: existing.id } });
      const counts = await getVoteCounts(params.reviewId);
      return { count: counts.up - counts.down, voted: false };
    }

    await prisma.helpfulVote.update({
      where: { id: existing.id },
      data: { value: params.value },
    });
    const counts = await getVoteCounts(params.reviewId);
    return { count: counts.up - counts.down, voted: true };
  }

  await prisma.helpfulVote.create({
    data: {
      reviewId: params.reviewId,
      userId: params.userId,
      value: params.value,
    },
  });

  // Notify review author on upvote
  if (params.value) {
    const review = await prisma.review.findUnique({
      where: { id: params.reviewId },
      include: { user: { select: { email: true, name: true } } },
    });

    if (review && review.user.email) {
      sendNotificationEmail({
        to: review.user.email,
        subject: "Your review helped another founder evaluate a vendor",
        body: `<p>Another founder found your vendor review helpful. Your firsthand experience is helping peers make better decisions.</p><p><a href="${process.env.NEXTAUTH_URL}/vendors/${review.vendorId}">View your review</a></p>`,
      }).catch(() => {});
    }

    createNotification({
      userId: review!.userId,
      type: "helpful_vote",
      title: "Your review helped another founder",
      body: "Another founder found your vendor review helpful.",
      link: `/vendors/${review!.vendorId}`,
    }).catch(() => {});
  }

  const counts = await getVoteCounts(params.reviewId);
  return { count: counts.up - counts.down, voted: true };
}

export async function getVoteCounts(reviewId: string) {
  const up = await prisma.helpfulVote.count({
    where: { reviewId, value: true },
  });
  const down = await prisma.helpfulVote.count({
    where: { reviewId, value: false },
  });
  return { up, down };
}

export async function getUserVote(reviewId: string, userId: string) {
  const vote = await prisma.helpfulVote.findUnique({
    where: { reviewId_userId: { reviewId, userId } },
  });
  return vote?.value ?? null;
}
