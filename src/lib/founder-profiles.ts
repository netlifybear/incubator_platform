import {
  founderProfileSlugFromEmail,
  normalizeFounderProfileSlug,
} from "@/lib/founder-profile-presenter";
import { prisma } from "@/lib/prisma";

const publicFounderProfileSelect = {
  id: true,
  bio: true,
  cohort: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  email: true,
  name: true,
  profileCompletePercentage: true,
  profileSlug: true,
  startupUrl: true,
  startupName: true,
  publicProfileEnabled: true,
};

export async function getPublicFounderProfile(slug: string) {
  const normalizedSlug = normalizeFounderProfileSlug(slug);

  if (!normalizedSlug) {
    return null;
  }

  const founderWithStableSlug = await prisma.user.findFirst({
    where: {
      role: "founder",
      cohortId: { not: null },
      profileSlug: normalizedSlug,
      publicProfileEnabled: true,
    },
    select: publicFounderProfileSelect,
  });

  if (founderWithStableSlug) {
    return founderWithStableSlug;
  }

  const legacyUsers = await prisma.user.findMany({
    where: {
      role: "founder",
      cohortId: { not: null },
      profileSlug: null,
      publicProfileEnabled: true,
    },
    select: publicFounderProfileSelect,
  });

  return (
    legacyUsers.find(
      (user) => founderProfileSlugFromEmail(user.email) === normalizedSlug,
    ) ?? null
  );
}
