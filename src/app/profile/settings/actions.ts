"use server";

import { revalidatePath } from "next/cache";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { prisma } from "@/lib/prisma";
import {
  normalizeFounderProfileSlug,
} from "@/lib/founder-profile-presenter";

export type ProfileActionState = {
  error?: string;
  success?: string;
};

function computeProfilePercentage(profile: {
  name?: string | null;
  bio?: string | null;
  startupUrl?: string | null;
  startupName?: string | null;
  profileSlug?: string | null;
}): number {
  const fields = [
    Boolean(profile.name),
    Boolean(profile.bio),
    Boolean(profile.startupUrl),
    Boolean(profile.startupName),
    Boolean(profile.profileSlug),
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export async function updateProfileAction(
  _state: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const founder = await getCurrentFounder();

  if (!hasActiveCohort(founder) || !founder?.cohortId) {
    return { error: "You must be a cohort founder to edit your profile." };
  }

  const name = String(formData.get("name") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const startupUrl = String(formData.get("startupUrl") ?? "").trim() || null;
  const startupName = String(formData.get("startupName") ?? "").trim() || null;
  const profileSlug = normalizeFounderProfileSlug(
    String(formData.get("profileSlug") ?? ""),
  ) || null;
  const publicProfileEnabled = formData.get("publicProfileEnabled") === "on";

  if (!profileSlug) {
    return { error: "A public profile slug is required." };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { profileSlug },
      select: { id: true },
    });

    if (existing && existing.id !== founder.id) {
      return { error: "That profile slug is already taken." };
    }

    const profileCompletePercentage = computeProfilePercentage({
      name,
      bio,
      startupUrl,
      startupName,
      profileSlug,
    });

    await prisma.user.update({
      where: { id: founder.id },
      data: {
        name,
        bio,
        startupUrl,
        startupName,
        profileSlug,
        publicProfileEnabled,
        profileCompletePercentage,
      },
    });

    revalidatePath("/profile/settings");
    revalidatePath(`/founder/${profileSlug}`);

    return { success: "Profile updated." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update profile.",
    };
  }
}
