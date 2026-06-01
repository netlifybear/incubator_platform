import { prisma } from "./prisma.ts";

export type SprintWithProgress = {
  id: string;
  name: string;
  description: string | null;
  goalReviewCount: number;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  cohortId: string;
  contributors: SprintContributor[];
};

export type SprintContributor = {
  userId: string;
  name: string | null;
  email: string;
  reviewCount: number;
};

export async function getActiveSprint(cohortId: string): Promise<SprintWithProgress | null> {
  const now = new Date();
  const sprint = await prisma.sprint.findFirst({
    where: {
      cohortId,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    orderBy: { endsAt: "asc" },
  });

  if (!sprint) return null;

  return enrichSprint(sprint);
}

export async function getSprintById(sprintId: string): Promise<SprintWithProgress | null> {
  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
  if (!sprint) return null;
  return enrichSprint(sprint);
}

export async function getSprintHistory(cohortId: string, limit = 10) {
  const now = new Date();
  const sprints = await prisma.sprint.findMany({
    where: {
      cohortId,
      endsAt: { lt: now },
    },
    orderBy: { endsAt: "desc" },
    take: limit,
  });

  return Promise.all(sprints.map(enrichSprint));
}

async function enrichSprint(sprint: {
  id: string;
  name: string;
  description: string | null;
  goalReviewCount: number;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  cohortId: string;
}): Promise<SprintWithProgress> {
  const founders = await prisma.user.findMany({
    where: { cohortId: sprint.cohortId, role: "founder" },
    select: { id: true, name: true, email: true },
  });

  const reviews = await prisma.review.findMany({
    where: {
      cohortId: sprint.cohortId,
      createdAt: { gte: sprint.startsAt, lte: sprint.endsAt },
    },
    select: { userId: true },
  });

  const reviewCountMap = new Map<string, number>();
  for (const r of reviews) {
    reviewCountMap.set(r.userId, (reviewCountMap.get(r.userId) ?? 0) + 1);
  }

  const contributors: SprintContributor[] = founders
    .map((f) => ({
      userId: f.id,
      name: f.name,
      email: f.email,
      reviewCount: reviewCountMap.get(f.id) ?? 0,
    }))
    .sort((a, b) => b.reviewCount - a.reviewCount);

  return { ...sprint, contributors };
}

function monthName(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export async function autoManageSprints(cohortId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const existing = await prisma.sprint.findFirst({
    where: {
      cohortId,
      startsAt: { gte: monthStart },
    },
    orderBy: { startsAt: "asc" },
  });

  if (existing) return { created: false, reason: "Sprint already exists for this month." };

  const name = `${monthName(now)} Sprint`;

  await prisma.sprint.create({
    data: {
      name,
      description: `Monthly push to fill gaps in the vendor directory.`,
      goalReviewCount: 3,
      startsAt: monthStart,
      endsAt: monthEnd,
      cohortId,
    },
  });

  return { created: true, name };
}

export async function autoManageAllCohorts() {
  const cohorts = await prisma.cohort.findMany({ select: { id: true } });
  const results: Array<{ cohortId: string; created: boolean; name?: string; reason?: string }> = [];

  for (const cohort of cohorts) {
    const result = await autoManageSprints(cohort.id);
    results.push({ cohortId: cohort.id, ...result });
  }

  return results;
}

export type SprintDigestInfo = {
  activeName?: string;
  activeMyReviews: number;
  activeGoal: number;
  recentName?: string;
  recentTotalReviews: number;
  recentParticipants: number;
};

export async function getSprintDigestInfo(cohortId: string, userId: string): Promise<SprintDigestInfo | null> {
  const now = new Date();
  const active = await prisma.sprint.findFirst({
    where: { cohortId, startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { endsAt: "asc" },
  });

  const recent = await prisma.sprint.findFirst({
    where: { cohortId, endsAt: { lt: now } },
    orderBy: { endsAt: "desc" },
  });

  let activeName: string | undefined;
  let activeMyReviews = 0;
  let activeGoal = 3;

  if (active) {
    activeName = active.name;
    activeGoal = active.goalReviewCount;
    activeMyReviews = await prisma.review.count({
      where: { userId, cohortId, createdAt: { gte: active.startsAt, lte: active.endsAt } },
    });
  }

  let recentName: string | undefined;
  let recentTotalReviews = 0;
  let recentParticipants = 0;

  if (recent) {
    recentName = recent.name;
    const reviews = await prisma.review.findMany({
      where: { cohortId, createdAt: { gte: recent.startsAt, lte: recent.endsAt } },
      select: { userId: true },
    });
    recentTotalReviews = reviews.length;
    recentParticipants = new Set(reviews.map((r) => r.userId)).size;
  }

  if (!active && !recent) return null;

  return { activeName, activeMyReviews, activeGoal, recentName, recentTotalReviews, recentParticipants };
}
