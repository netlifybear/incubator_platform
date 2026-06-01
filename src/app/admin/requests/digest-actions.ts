"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { sendWeeklyDigestToCohort } from "@/lib/weekly-digest";

export type DigestActionState = {
  error?: string;
  sent?: number;
  total?: number;
};

export async function sendDigestAction(
  _state: DigestActionState,
  formData: FormData,
): Promise<DigestActionState> {
  void _state;
  void formData;

  const admin = await getCurrentAdmin();
  if (!admin?.cohortId || !admin.cohort) {
    return { error: "Not authorized." };
  }

  try {
    const result = await sendWeeklyDigestToCohort(admin.cohortId);
    revalidatePath("/admin/requests");
    return result;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to send digest." };
  }
}
