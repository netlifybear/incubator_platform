import { prisma } from "@/lib/prisma";

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
