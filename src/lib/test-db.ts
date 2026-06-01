import { prisma } from "./prisma.ts";

export function testRunId(prefix: string) {
  return `test-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function createTestCohort(slug: string) {
  return prisma.cohort.create({
    data: {
      name: `Test Cohort ${slug}`,
      slug,
    },
  });
}

export async function createTestFounder(input: {
  cohortId?: string | null;
  email: string;
  name?: string;
  role?: string;
}) {
  return prisma.user.create({
    data: {
      cohortId: input.cohortId ?? null,
      email: input.email,
      name: input.name ?? input.email,
      role: input.role ?? "founder",
    },
  });
}

export async function createTestVendor(input: {
  badgeAwardSecret?: string;
  cohortId: string;
  name: string;
}) {
  return prisma.vendor.create({
    data: {
      badgeAwardSecret: input.badgeAwardSecret ?? null,
      category: "Testing",
      cohortId: input.cohortId,
      name: input.name,
    },
  });
}

export async function createTestReview(input: {
  cohortId: string;
  comment?: string;
  rating?: number;
  userId: string;
  vendorId: string;
}) {
  return prisma.review.create({
    data: {
      cohortId: input.cohortId,
      comment: input.comment ?? "Detailed test review with a specific service and outcome in 2026.",
      rating: input.rating ?? 5,
      userId: input.userId,
      vendorId: input.vendorId,
    },
  });
}

export async function cleanupTestData(input: {
  cohortSlugs?: string[];
  emails?: string[];
  issuerSecretHashes?: string[];
}) {
  if (input.issuerSecretHashes?.length) {
    await prisma.badgeAwardAttempt.deleteMany({
      where: { secretHash: { in: input.issuerSecretHashes } },
    });
  }

  if (input.emails?.length) {
    const users = await prisma.user.findMany({
      where: { email: { in: input.emails } },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    if (userIds.length) {
      await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.activityEvent.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.backlinkSnapshot.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.backlinkLog.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.badge.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.helpfulVote.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.vendorRequest.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.review.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  }

  if (input.cohortSlugs?.length) {
    const cohorts = await prisma.cohort.findMany({
      where: { slug: { in: input.cohortSlugs } },
      select: { id: true },
    });
    const cohortIds = cohorts.map((c) => c.id);
    if (cohortIds.length) {
      await prisma.consumerReview.deleteMany({ where: { cohortId: { in: cohortIds } } });
      await prisma.helpfulVote.deleteMany({
        where: { review: { cohortId: { in: cohortIds } } },
      });
      await prisma.review.deleteMany({ where: { cohortId: { in: cohortIds } } });
      await prisma.vendorRequest.deleteMany({ where: { cohortId: { in: cohortIds } } });
      await prisma.invite.deleteMany({ where: { cohortId: { in: cohortIds } } });
      await prisma.badgeNomination.deleteMany({ where: { cohortId: { in: cohortIds } } });
      await prisma.sprint.deleteMany({ where: { cohortId: { in: cohortIds } } });
      await prisma.guestPostExchange.deleteMany({ where: { cohortId: { in: cohortIds } } });
      await prisma.activityEvent.deleteMany({ where: { cohortId: { in: cohortIds } } });
      await prisma.notification.deleteMany({
        where: { user: { cohortId: { in: cohortIds } } },
      });
      await prisma.vendor.deleteMany({ where: { cohortId: { in: cohortIds } } });
      await prisma.user.deleteMany({ where: { cohortId: { in: cohortIds } } });
      await prisma.cohort.deleteMany({ where: { id: { in: cohortIds } } });
    }
  }
}
