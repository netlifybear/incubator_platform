"use server";

import { revalidatePath } from "next/cache";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort } from "@/lib/tenant-policy";
import { createVendorRequestForCohort } from "@/lib/vendor-requests";

export type VendorRequestActionState = {
  error?: string;
  success?: string;
};

export async function createVendorRequestAction(
  _state: VendorRequestActionState,
  formData: FormData,
): Promise<VendorRequestActionState> {
  const founder = await getCurrentFounder();

  if (!hasActiveCohort(founder)) {
    return { error: "You must be signed in as a cohort founder to request vendors." };
  }

  try {
    await createVendorRequestForCohort({
      cohortId: founder.cohortId,
      userId: founder.id,
      category: String(formData.get("category") ?? ""),
      description: String(formData.get("description") ?? ""),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create request.",
    };
  }

  revalidatePath("/");
  return { success: "Request posted. The cohort can now see what you need." };
}
