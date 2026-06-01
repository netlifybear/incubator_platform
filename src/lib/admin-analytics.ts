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
  const consumerReviews = await prisma.consumerReview.count({ where: { cohortId } });
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
      consumer: consumerReviews,
      firsthand: firsthandReviews,
      total: totalReviews,
    },
    totalVendors,
  };
}

export async function getAdminFlywheelMetrics(cohortId: string) {
  const [cohortUsers, allReviews, consumerReviews, backlinks, targetedRequests] = await Promise.all([
    prisma.user.findMany({
      where: { cohortId, role: "founder" },
      select: {
        id: true,
        profileViewCount: true,
        publicProfileEnabled: true,
        _count: { select: { reviews: true } },
      },
    }),
    prisma.review.count({ where: { cohortId } }),
    prisma.consumerReview.count({ where: { cohortId } }),
    prisma.backlinkLog.findMany({
      where: { userId: { in: (await prisma.user.findMany({ where: { cohortId }, select: { id: true } })).map(u => u.id) } },
      select: { status: true, userId: true },
    }),
    prisma.vendorRequest.count({
      where: { cohortId, targetUserId: { not: null }, status: "open" },
    }),
  ]);

  const totalProfileViews = cohortUsers.reduce((s, u) => s + u.profileViewCount, 0);
  const foundersWithPublicProfile = cohortUsers.filter((u) => u.publicProfileEnabled).length;
  const foundersWithReviews = cohortUsers.filter((u) => u._count.reviews > 0).length;
  const totalFounders = cohortUsers.length;

  const foundersWithBacklinks = new Set(backlinks.map((b) => b.userId)).size;
  const verifiedBacklinks = backlinks.filter((b) => b.status === "verified").length;
  const lostBacklinks = backlinks.filter((b) => b.status === "lost").length;
  const pendingBacklinks = backlinks.filter((b) => b.status === "pending").length;

  return {
    totalFounders,
    totalProfileViews,
    avgProfileViews: totalFounders > 0 ? Math.round(totalProfileViews / totalFounders) : 0,
    foundersWithPublicProfile,
    pctPublicProfile: totalFounders > 0 ? Math.round((foundersWithPublicProfile / totalFounders) * 100) : 0,
    foundersWithReviews,
    pctWithReviews: totalFounders > 0 ? Math.round((foundersWithReviews / totalFounders) * 100) : 0,
    totalReviews: allReviews,
    consumerReviews,
    reviewsPerFounder: totalFounders > 0 ? Math.round((allReviews / totalFounders) * 10) / 10 : 0,
    backlinks: {
      foundersWithBacklinks,
      verified: verifiedBacklinks,
      lost: lostBacklinks,
      pending: pendingBacklinks,
    },
    targetedRequests,
  };
}
