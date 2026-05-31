"use server";

import { revalidatePath } from "next/cache";
import { getCurrentFounder } from "@/lib/auth";
import { createNomination } from "@/lib/nominations";
import { prisma } from "@/lib/prisma";

export type NominationActionState = {
  error?: string;
  success?: string;
};

export async function createNominationAction(
  _state: NominationActionState,
  formData: FormData,
): Promise<NominationActionState> {
  const founder = await getCurrentFounder();

  if (!founder?.cohortId) {
    return { error: "You must be a cohort founder to nominate." };
  }

  const nomineeEmail = String(formData.get("nomineeEmail") ?? "").trim().toLowerCase();
  const badgeType = String(formData.get("badgeType") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!nomineeEmail || !badgeType || !reason) {
    return { error: "All fields are required." };
  }

  if (reason.length < 20) {
    return { error: "Please provide a more detailed reason (at least 20 characters)." };
  }

  const nominee = await prisma.user.findUnique({
    where: { email: nomineeEmail },
    select: { id: true, cohortId: true, name: true },
  });

  if (!nominee) {
    return { error: "No founder found with that email." };
  }

  if (nominee.cohortId !== founder.cohortId) {
    return { error: "That founder is not in your cohort." };
  }

  try {
    await createNomination({
      nominatorId: founder.id,
      nomineeId: nominee.id,
      badgeType,
      reason,
      cohortId: founder.cohortId,
    });
    revalidatePath("/nominations");
    return { success: `Nomination submitted for ${nominee.name ?? nomineeEmail}.` };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not submit nomination.",
    };
  }
}
