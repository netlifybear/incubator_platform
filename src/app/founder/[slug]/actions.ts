"use server";

import { prisma } from "@/lib/prisma";
import { normalizeFounderProfileSlug } from "@/lib/founder-profile-presenter";

export async function incrementProfileView(slug: string) {
  const normalizedSlug = normalizeFounderProfileSlug(slug);

  if (!normalizedSlug) {
    return;
  }

  await prisma.user.updateMany({
    where: {
      profileSlug: normalizedSlug,
      publicProfileEnabled: true,
    },
    data: {
      profileViewCount: { increment: 1 },
    },
  });
}
