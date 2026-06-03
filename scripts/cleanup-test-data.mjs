import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = process.env.DIRECT_DATABASE_URL
  ? new PrismaPg({ connectionString: process.env.DIRECT_DATABASE_URL })
  : undefined;
const accelerateUrl = !adapter && process.env.DATABASE_URL?.startsWith("prisma")
  ? process.env.DATABASE_URL
  : undefined;

const prisma = new PrismaClient({
  ...(adapter ? { adapter } : {}),
  ...(accelerateUrl ? { accelerateUrl } : {}),
});

const apply = process.argv.includes("--apply");

const cohortSlugWhere = {
  OR: [
    { slug: { startsWith: "test-" } },
    { slug: { startsWith: "cf-" } },
    { slug: { startsWith: "cohort-impact-" } },
    { slug: { startsWith: "impact-test-" } },
    { slug: { startsWith: "leaderboard-test-" } },
    { slug: { startsWith: "notif-test-" } },
  ],
};

const userEmailWhere = {
  OR: [
    { email: { startsWith: "test-" } },
    { email: { startsWith: "cohort-impact-" } },
    { email: { startsWith: "cf-" } },
    { email: { startsWith: "impact-" } },
    { email: { startsWith: "leaderboard-" } },
    { email: { startsWith: "notif-test-" } },
  ],
};

async function countByModel(model, where) {
  return prisma[model].count({ where });
}

async function main() {
  const cohorts = await prisma.cohort.findMany({
    where: cohortSlugWhere,
    select: { id: true, slug: true },
  });
  const cohortIds = cohorts.map((cohort) => cohort.id);

  const users = await prisma.user.findMany({
    where: {
      OR: [
        userEmailWhere,
        ...(cohortIds.length ? [{ cohortId: { in: cohortIds } }] : []),
      ],
    },
    select: { id: true, email: true },
  });
  const userIds = users.map((user) => user.id);

  const vendors = cohortIds.length
    ? await prisma.vendor.findMany({
        where: { cohortId: { in: cohortIds } },
        select: { id: true },
      })
    : [];
  const vendorIds = vendors.map((vendor) => vendor.id);

  const reviews = await prisma.review.findMany({
    where: {
      OR: [
        ...(cohortIds.length ? [{ cohortId: { in: cohortIds } }] : []),
        ...(userIds.length ? [{ userId: { in: userIds } }] : []),
        ...(vendorIds.length ? [{ vendorId: { in: vendorIds } }] : []),
      ],
    },
    select: { id: true },
  });
  const reviewIds = reviews.map((review) => review.id);

  const counts = {
    cohorts: cohorts.length,
    users: users.length,
    vendors: vendors.length,
    reviews: reviews.length,
    helpfulVotes: reviewIds.length || userIds.length
      ? await countByModel("helpfulVote", {
          OR: [
            ...(reviewIds.length ? [{ reviewId: { in: reviewIds } }] : []),
            ...(userIds.length ? [{ userId: { in: userIds } }] : []),
          ],
        })
      : 0,
    contributionTags: userIds.length
      ? await countByModel("contributionTag", { userId: { in: userIds } })
      : 0,
    vendorRequests: cohortIds.length || userIds.length || vendorIds.length
      ? await countByModel("vendorRequest", {
          OR: [
            ...(cohortIds.length ? [{ cohortId: { in: cohortIds } }] : []),
            ...(userIds.length ? [{ userId: { in: userIds } }, { targetUserId: { in: userIds } }] : []),
            ...(vendorIds.length ? [{ fulfilledVendorId: { in: vendorIds } }] : []),
          ],
        })
      : 0,
    notifications: userIds.length
      ? await countByModel("notification", { userId: { in: userIds } })
      : 0,
    activityEvents: cohortIds.length || userIds.length
      ? await countByModel("activityEvent", {
          OR: [
            ...(cohortIds.length ? [{ cohortId: { in: cohortIds } }] : []),
            ...(userIds.length ? [{ userId: { in: userIds } }] : []),
          ],
        })
      : 0,
  };

  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", counts, cohortSlugs: cohorts.map((c) => c.slug).slice(0, 20) }, null, 2));

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to delete these local test artifacts.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (reviewIds.length || userIds.length) {
      await tx.helpfulVote.deleteMany({
        where: {
          OR: [
            ...(reviewIds.length ? [{ reviewId: { in: reviewIds } }] : []),
            ...(userIds.length ? [{ userId: { in: userIds } }] : []),
          ],
        },
      });
    }

    if (userIds.length) {
      await tx.reputationImport.deleteMany({ where: { userId: { in: userIds } } });
      await tx.notification.deleteMany({ where: { userId: { in: userIds } } });
      await tx.backlinkSnapshot.deleteMany({ where: { userId: { in: userIds } } });
      await tx.backlinkLog.deleteMany({ where: { userId: { in: userIds } } });
      await tx.contributionTag.deleteMany({ where: { userId: { in: userIds } } });
      await tx.gscState.deleteMany({ where: { userId: { in: userIds } } });
      await tx.session.deleteMany({ where: { userId: { in: userIds } } });
      await tx.account.deleteMany({ where: { userId: { in: userIds } } });
    }

    if (cohortIds.length || userIds.length) {
      await tx.tagNomination.deleteMany({
        where: {
          OR: [
            ...(cohortIds.length ? [{ cohortId: { in: cohortIds } }] : []),
            ...(userIds.length ? [{ nominatorId: { in: userIds } }, { nomineeId: { in: userIds } }] : []),
          ],
        },
      });
      await tx.guestPostExchange.deleteMany({
        where: {
          OR: [
            ...(cohortIds.length ? [{ cohortId: { in: cohortIds } }] : []),
            ...(userIds.length ? [{ requesterId: { in: userIds } }, { recipientId: { in: userIds } }] : []),
          ],
        },
      });
      await tx.invite.deleteMany({
        where: {
          OR: [
            ...(cohortIds.length ? [{ cohortId: { in: cohortIds } }] : []),
            ...(userIds.length ? [{ invitedById: { in: userIds } }] : []),
          ],
        },
      });
      await tx.vendorRequest.deleteMany({
        where: {
          OR: [
            ...(cohortIds.length ? [{ cohortId: { in: cohortIds } }] : []),
            ...(userIds.length ? [{ userId: { in: userIds } }, { targetUserId: { in: userIds } }] : []),
            ...(vendorIds.length ? [{ fulfilledVendorId: { in: vendorIds } }] : []),
          ],
        },
      });
      await tx.activityEvent.deleteMany({
        where: {
          OR: [
            ...(cohortIds.length ? [{ cohortId: { in: cohortIds } }] : []),
            ...(userIds.length ? [{ userId: { in: userIds } }] : []),
          ],
        },
      });
    }

    if (reviewIds.length) {
      await tx.review.deleteMany({ where: { id: { in: reviewIds } } });
    }
    if (cohortIds.length) {
      await tx.consumerReview.deleteMany({ where: { cohortId: { in: cohortIds } } });
      await tx.sprint.deleteMany({ where: { cohortId: { in: cohortIds } } });
    }
    if (vendorIds.length) {
      await tx.vendor.deleteMany({ where: { id: { in: vendorIds } } });
    }
    if (userIds.length) {
      await tx.user.deleteMany({ where: { id: { in: userIds } } });
    }
    if (cohortIds.length) {
      await tx.cohort.deleteMany({ where: { id: { in: cohortIds } } });
    }
  });

  console.log("Deleted local test artifacts.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
