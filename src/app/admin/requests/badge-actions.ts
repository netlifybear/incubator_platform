"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { canManageCohort } from "@/lib/admin-policy";
import { prisma } from "@/lib/prisma";
import { awardBadge } from "@/lib/badges";

export type AwardBadgeActionState = {
  error?: string;
  success?: string;
};

export async function awardBadgeAction(
  _state: AwardBadgeActionState,
  formData: FormData,
): Promise<AwardBadgeActionState> {
  const admin = await getCurrentAdmin();

  if (!admin?.cohortId || !canManageCohort(admin, admin.cohortId)) {
    return { error: "Only cohort admins can award badges." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const badgeType = String(formData.get("badgeType") ?? "");
  const description = String(formData.get("description") ?? "").trim() || undefined;

  if (!email) {
    return { error: "Founder email is required." };
  }

  const founder = await prisma.user.findUnique({
    where: { email },
    select: { id: true, cohortId: true, name: true },
  });

  if (!founder) {
    return { error: "No founder found with that email." };
  }

  if (founder.cohortId !== admin.cohortId) {
    return { error: "This founder is not in your cohort." };
  }

  try {
    await awardBadge(founder.id, badgeType, description, "admin");
    revalidatePath("/admin/requests");
    return { success: `${badgeType} badge awarded to ${founder.name ?? email}.` };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not award badge.",
    };
  }
}
