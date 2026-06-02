import { prisma } from "@/lib/prisma";
import { contributionTagDefinition } from "@/config/contribution-tag-definitions";
import { awardTag } from "@/lib/contribution-tags";

export type NominationWithUsers = {
  id: string;
  tagType: string;
  reason: string;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewerNote: string | null;
  nominator: { id: string; name: string | null; email: string };
  nominee: { id: string; name: string | null; email: string };
};

export async function createNomination(input: {
  nominatorId: string;
  nomineeId: string;
  tagType: string;
  reason: string;
  cohortId: string;
}) {
  if (input.nominatorId === input.nomineeId) {
    throw new Error("You cannot nominate yourself.");
  }

  const def = contributionTagDefinition(input.tagType);
  if (!def) {
    throw new Error(`Unknown tag type: ${input.tagType}`);
  }
  if (!def.nominatable) {
    throw new Error(`"${def.label}" tags cannot be nominated by peers.`);
  }

  const existing = await prisma.tagNomination.findFirst({
    where: {
      nominatorId: input.nominatorId,
      nomineeId: input.nomineeId,
      tagType: input.tagType,
      status: "pending",
    },
  });

  if (existing) {
    throw new Error("You already have a pending nomination for this founder and tag type.");
  }

  return prisma.tagNomination.create({
    data: {
      tagType: input.tagType,
      reason: input.reason,
      nominatorId: input.nominatorId,
      nomineeId: input.nomineeId,
      cohortId: input.cohortId,
    },
  });
}

export async function listPendingNominations(cohortId: string) {
  return prisma.tagNomination.findMany({
    where: { cohortId, status: "pending" },
    orderBy: { createdAt: "desc" },
    include: {
      nominator: { select: { id: true, name: true, email: true } },
      nominee: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listNominationsForFounder(founderId: string) {
  return prisma.tagNomination.findMany({
    where: {
      OR: [{ nominatorId: founderId }, { nomineeId: founderId }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      nominator: { select: { id: true, name: true, email: true } },
      nominee: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function approveNomination(
  nominationId: string,
  reviewerNote?: string,
) {
  const nomination = await prisma.tagNomination.findUnique({
    where: { id: nominationId },
  });

  if (!nomination) {
    throw new Error("Nomination not found.");
  }
  if (nomination.status !== "pending") {
    throw new Error("This nomination has already been reviewed.");
  }

  await prisma.tagNomination.update({
    where: { id: nominationId },
    data: {
      status: "approved",
      reviewedAt: new Date(),
      reviewerNote,
    },
  });

  await awardTag(nomination.nomineeId, nomination.tagType,
    `Nominated by cohort peer: ${nomination.reason}`, "admin");

  return { success: true };
}

export async function rejectNomination(
  nominationId: string,
  reviewerNote?: string,
) {
  const nomination = await prisma.tagNomination.findUnique({
    where: { id: nominationId },
  });

  if (!nomination) {
    throw new Error("Nomination not found.");
  }
  if (nomination.status !== "pending") {
    throw new Error("This nomination has already been reviewed.");
  }

  await prisma.tagNomination.update({
    where: { id: nominationId },
    data: {
      status: "rejected",
      reviewedAt: new Date(),
      reviewerNote,
    },
  });

  return { success: true };
}

export async function listFoundersWithTags(cohortId: string) {
  const founders = await prisma.user.findMany({
    where: { cohortId, role: "founder" },
    select: {
      id: true,
      name: true,
      email: true,
      badges: {
        select: {
          type: true,
          description: true,
          earnedAt: true,
          issuerType: true,
        },
        orderBy: { earnedAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return founders.map((f) => ({
    ...f,
    badges: f.badges.map((t) => ({
      ...t,
      def: contributionTagDefinition(t.type),
    })),
  }));
}
