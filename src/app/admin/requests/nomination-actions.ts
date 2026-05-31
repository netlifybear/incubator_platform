"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { canManageCohort } from "@/lib/admin-policy";
import {
  approveNomination,
  rejectNomination,
} from "@/lib/nominations";

export type AdminNominationActionState = {
  error?: string;
  success?: string;
};

export async function approveNominationAction(
  nominationId: string,
  _state: AdminNominationActionState,
  formData: FormData,
): Promise<AdminNominationActionState> {
  const admin = await getCurrentAdmin();
  if (!admin?.cohortId || !canManageCohort(admin, admin.cohortId)) {
    return { error: "Only cohort admins can approve nominations." };
  }

  const note = String(formData.get("reviewerNote") ?? "").trim() || undefined;

  try {
    await approveNomination(nominationId, note);
    revalidatePath("/admin/requests");
    return { success: "Nomination approved." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not approve nomination.",
    };
  }
}

export async function rejectNominationAction(
  nominationId: string,
  _state: AdminNominationActionState,
  formData: FormData,
): Promise<AdminNominationActionState> {
  const admin = await getCurrentAdmin();
  if (!admin?.cohortId || !canManageCohort(admin, admin.cohortId)) {
    return { error: "Only cohort admins can reject nominations." };
  }

  const note = String(formData.get("reviewerNote") ?? "").trim() || undefined;

  try {
    await rejectNomination(nominationId, note);
    revalidatePath("/admin/requests");
    return { success: "Nomination rejected." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not reject nomination.",
    };
  }
}
