"use server";

import { revalidatePath } from "next/cache";
import { getCurrentFounder } from "@/lib/auth";
import { hasActiveCohort, canWriteToCohort } from "@/lib/tenant-policy";
import { createGuestPostRequest, updateExchangeStatus } from "@/lib/guest-posts";

export type CreateExchangeActionState = {
  error?: string;
  success?: string;
};

export async function createExchangeAction(
  _state: CreateExchangeActionState,
  formData: FormData,
): Promise<CreateExchangeActionState> {
  const founder = await getCurrentFounder();
  if (!founder || !hasActiveCohort(founder) || !founder.cohort) {
    return { error: "You must be signed in to a cohort." };
  }

  if (!canWriteToCohort(founder)) {
    return { error: "Alumni cannot create exchange requests." };
  }

  const recipientId = String(formData.get("recipientId") ?? "");
  const topic = String(formData.get("topic") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim() || undefined;

  if (!recipientId) return { error: "Recipient is required." };
  if (recipientId === founder.id) return { error: "You cannot request an exchange with yourself." };
  if (!topic) return { error: "Topic is required." };

  try {
    await createGuestPostRequest({
      requesterId: founder.id,
      recipientId,
      topic,
      message,
      cohortId: founder.cohort.id,
    });

    revalidatePath("/exchanges");
    return { success: "Exchange request sent." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create request.",
    };
  }
}

export type UpdateExchangeActionState = {
  error?: string;
  success?: string;
};

export async function updateExchangeAction(
  _state: UpdateExchangeActionState,
  formData: FormData,
): Promise<UpdateExchangeActionState> {
  const founder = await getCurrentFounder();
  if (!founder || !hasActiveCohort(founder) || !founder.cohort) {
    return { error: "You must be signed in to a cohort." };
  }

  if (!canWriteToCohort(founder)) {
    return { error: "Alumni cannot update exchanges." };
  }

  const exchangeId = String(formData.get("exchangeId") ?? "");
  const status = String(formData.get("status") ?? "");
  const publishedUrl = String(formData.get("publishedUrl") ?? "").trim() || undefined;

  if (!exchangeId || !status) return { error: "Missing required fields." };

  try {
    await updateExchangeStatus({ exchangeId, userId: founder.id, status, publishedUrl });
    revalidatePath("/exchanges");
    return { success: `Exchange ${status}.` };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update exchange.",
    };
  }
}
