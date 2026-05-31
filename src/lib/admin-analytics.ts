import { adminHealthMessage } from "./admin-analytics-presenter.ts";
import { prisma } from "./prisma.ts";

export async function getAdminTrustMetrics(cohortId: string) {
  const now = new Date();
  const openRequests = await prisma.vendorRequest.count({ where: { cohortId, status: "open" } });
  const fulfilledRequests = await prisma.vendorRequest.count({
    where: { cohortId, status: "fulfilled" },
  });
  const closedRequests = await prisma.vendorRequest.count({
    where: { cohortId, status: "closed" },
  });
  const totalVendors = await prisma.vendor.count({ where: { cohortId } });
  const totalReviews = await prisma.review.count({ where: { cohortId } });
  const firsthandReviews = await prisma.review.count({
    where: { cohortId, usedVendor: true },
  });
  const openInvites = await prisma.invite.count({
    where: {
      cohortId,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gte: now },
    },
  });
  const acceptedInvites = await prisma.invite.count({
    where: {
      cohortId,
      acceptedAt: { not: null },
    },
  });
  const expiredInvites = await prisma.invite.count({
    where: {
      cohortId,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { lt: now },
    },
  });
  const revokedInvites = await prisma.invite.count({
    where: {
      cohortId,
      revokedAt: { not: null },
    },
  });

  return {
    closedRequests,
    fulfilledRequests,
    healthMessage: adminHealthMessage({
      firsthandReviews,
      openRequests,
      totalReviews,
    }),
    invites: {
      accepted: acceptedInvites,
      expired: expiredInvites,
      open: openInvites,
      revoked: revokedInvites,
    },
    openRequests,
    reviews: {
      firsthand: firsthandReviews,
      total: totalReviews,
    },
    totalVendors,
  };
}
