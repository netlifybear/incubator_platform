"use server";

import { revalidatePath } from "next/cache";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort, canWriteToCohort } from "@/lib/tenant-policy";
import { createInviteForCohort } from "@/lib/invites";

export type FounderInviteState = {
  error?: string;
  success?: string;
  invitePath?: string;
};

export async function createFounderInviteAction(
  _state: FounderInviteState,
  formData: FormData,
): Promise<FounderInviteState> {
  const founder = await getCurrentFounder();

  if (!hasActiveCohort(founder)) {
    return { error: "You must be signed in to a cohort." };
  }

  if (!canWriteToCohort(founder)) {
    return { error: "Alumni cannot create invites." };
  }

  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Email is required." };
  }

  try {
    const invite = await createInviteForCohort({
      cohortId: founder.cohortId,
      email,
      invitedById: founder.id,
    });

    revalidatePath("/invite");
    return {
      invitePath: `/invite/${invite.token}`,
      success: `Invite sent to ${invite.email}.`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create invite.",
    };
  }
}
