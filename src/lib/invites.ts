import crypto from "node:crypto";
import { prisma } from "./prisma.ts";
import {
  getInviteExpirationDate,
  normalizeInviteEmail,
} from "./invite-validation.ts";

export type CreateInviteInput = {
  cohortId: string;
  email: string;
  invitedById?: string;
};

export async function createInviteForCohort(input: CreateInviteInput) {
  const email = normalizeInviteEmail(input.email);
  const now = new Date();

  return prisma.invite.create({
    data: {
      cohortId: input.cohortId,
      email,
      token: crypto.randomBytes(24).toString("hex"),
      expiresAt: getInviteExpirationDate(now),
      ...(input.invitedById ? { invitedById: input.invitedById } : {}),
    },
  });
}

export async function listInvitesForCohort(cohortId: string) {
  return prisma.invite.findMany({
    where: {
      cohortId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
    include: {
      invitedBy: {
        select: { name: true, email: true },
      },
    },
  });
}

export async function getFounderReferralStats(founderId: string) {
  const [sent, accepted] = await Promise.all([
    prisma.invite.count({
      where: { invitedById: founderId },
    }),
    prisma.invite.count({
      where: { invitedById: founderId, acceptedAt: { not: null } },
    }),
  ]);

  return { sent, accepted };
}

export async function getInviteByToken(token: string) {
  return prisma.invite.findUnique({
    where: { token },
    include: { cohort: true },
  });
}

export async function acceptInviteByToken(token: string, actorEmail: string) {
  const normalizedActorEmail = normalizeInviteEmail(actorEmail);
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { cohort: true },
  });

  if (!invite) {
    throw new Error("Invite not found.");
  }

  if (invite.acceptedAt) {
    throw new Error("Invite has already been accepted.");
  }

  if (invite.revokedAt) {
    throw new Error("Invite has been revoked.");
  }

  if (invite.expiresAt < new Date()) {
    throw new Error("Invite has expired.");
  }

  if (normalizedActorEmail !== invite.email) {
    throw new Error("You must be signed in with the invited email address to accept this invite.");
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email: invite.email },
      update: {
        cohortId: invite.cohortId,
        publicProfileEnabled: false,
        role: "founder",
      },
      create: {
        email: invite.email,
        name: invite.email.split("@")[0],
        cohortId: invite.cohortId,
        publicProfileEnabled: false,
        role: "founder",
      },
    });

    const acceptedInvite = await tx.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
      include: { cohort: true },
    });

    return { invite: acceptedInvite, user };
  });
}

export type RevokeInviteInput = {
  cohortId: string;
  inviteId: string;
};

export async function revokeInviteForCohort(input: RevokeInviteInput) {
  const invite = await prisma.invite.findFirst({
    where: {
      id: input.inviteId,
      cohortId: input.cohortId,
      acceptedAt: null,
      revokedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!invite) {
    throw new Error("Open invite not found for this cohort.");
  }

  return prisma.invite.update({
    where: { id: invite.id },
    data: {
      revokedAt: new Date(),
    },
  });
}
