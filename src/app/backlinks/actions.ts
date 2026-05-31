"use server";

import { revalidatePath } from "next/cache";
import { getCurrentFounder } from "@/lib/auth";
import { addBacklink, removeBacklink, verifyBacklink, verifyAllBacklinks } from "@/lib/backlinks";

export type BacklinkActionState = {
  error?: string;
  success?: string;
};

export async function addBacklinkAction(
  _state: BacklinkActionState,
  formData: FormData,
): Promise<BacklinkActionState> {
  const founder = await getCurrentFounder();
  if (!founder) {
    return { error: "You must be signed in." };
  }

  const referringDomain = String(formData.get("referringDomain") ?? "");

  try {
    await addBacklink({ userId: founder.id, referringDomain, targetUrl: founder.startupUrl ?? undefined });
    revalidatePath("/backlinks");
    return { success: "Domain added." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not add domain.",
    };
  }
}

export async function removeBacklinkAction(
  id: string,
): Promise<BacklinkActionState> {
  const founder = await getCurrentFounder();
  if (!founder) {
    return { error: "You must be signed in." };
  }

  try {
    await removeBacklink(id, founder.id);
    revalidatePath("/backlinks");
    return { success: "Domain removed." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not remove domain.",
    };
  }
}

export async function verifySingleAction(
  id: string,
): Promise<BacklinkActionState> {
  const founder = await getCurrentFounder();
  if (!founder) {
    return { error: "You must be signed in." };
  }

  try {
    const result = await verifyBacklink(id, founder.id);
    revalidatePath("/backlinks");
    return {
      success: result.status === "verified"
        ? "Domain reachable. Confirm the page still links to your startup before treating it as a backlink."
        : "Domain unreachable or returned an error.",
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not verify domain.",
    };
  }
}

export async function verifyAllAction(): Promise<BacklinkActionState> {
  const founder = await getCurrentFounder();
  if (!founder) {
    return { error: "You must be signed in." };
  }

  try {
    const results = await verifyAllBacklinks(founder.id);
    const verified = results.filter((r) => r.status === "verified").length;
    const lost = results.filter((r) => r.status === "lost").length;
    revalidatePath("/backlinks");
    return {
      success: `Checked ${results.length} domain${results.length === 1 ? "" : "s"} — ${verified} reachable, ${lost} unreachable. Reachability does not prove the backlink is present.`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not verify domains.",
    };
  }
}
