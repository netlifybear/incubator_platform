"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { canManageCohort } from "@/lib/admin-policy";
import { prisma } from "@/lib/prisma";

export type CreateSprintActionState = {
  error?: string;
  success?: string;
};

export async function createSprintAction(
  _state: CreateSprintActionState,
  formData: FormData,
): Promise<CreateSprintActionState> {
  const admin = await getCurrentAdmin();

  if (!admin?.cohortId || !canManageCohort(admin, admin.cohortId)) {
    return { error: "Only cohort admins can create sprints." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const goalReviewCount = parseInt(String(formData.get("goalReviewCount") ?? "3"), 10);
  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  const endsAt = new Date(String(formData.get("endsAt") ?? ""));

  if (!name) return { error: "Sprint name is required." };
  if (isNaN(goalReviewCount) || goalReviewCount < 1) return { error: "Goal must be at least 1 review." };
  if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) return { error: "Valid start and end dates are required." };
  if (endsAt <= startsAt) return { error: "End date must be after start date." };

  try {
    await prisma.sprint.create({
      data: {
        name,
        description,
        goalReviewCount,
        startsAt,
        endsAt,
        cohortId: admin.cohortId,
      },
    });

    revalidatePath("/sprints");
    revalidatePath("/admin/requests");
    return { success: `Sprint "${name}" created.` };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create sprint.",
    };
  }
}
