"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { canManageCohort } from "@/lib/admin-policy";
import { createInviteForCohort, revokeInviteForCohort } from "@/lib/invites";
import {
  closeVendorRequestForCohort,
  fulfillVendorRequestWithVendor,
  updateOpenVendorRequestForCohort,
} from "@/lib/vendor-requests";

export type FulfillRequestActionState = {
  error?: string;
  success?: string;
};

export type CloseRequestActionState = {
  error?: string;
  success?: string;
};

export type EditRequestActionState = {
  error?: string;
  success?: string;
};

export type CreateInviteActionState = {
  error?: string;
  invitePath?: string;
  success?: string;
};

export type RevokeInviteActionState = {
  error?: string;
  success?: string;
};

export async function fulfillVendorRequestAction(
  requestId: string,
  _state: FulfillRequestActionState,
  formData: FormData,
): Promise<FulfillRequestActionState> {
  const admin = await getCurrentAdmin();

  if (!admin?.cohortId || !canManageCohort(admin, admin.cohortId)) {
    return { error: "Only cohort admins can fulfill vendor requests." };
  }

  try {
    const { vendor } = await fulfillVendorRequestWithVendor({
      requestId,
      cohortId: admin.cohortId,
      vendorName: String(formData.get("vendorName") ?? ""),
      vendorContact: String(formData.get("vendorContact") ?? ""),
    });

    revalidatePath("/");
    revalidatePath("/requests");
    revalidatePath("/admin/requests");
    return { success: `${vendor.name} was added and the request was fulfilled.` };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not fulfill request.",
    };
  }
}

export async function editVendorRequestAction(
  requestId: string,
  _state: EditRequestActionState,
  formData: FormData,
): Promise<EditRequestActionState> {
  const admin = await getCurrentAdmin();

  if (!admin?.cohortId || !canManageCohort(admin, admin.cohortId)) {
    return { error: "Only cohort admins can edit vendor requests." };
  }

  try {
    await updateOpenVendorRequestForCohort({
      requestId,
      cohortId: admin.cohortId,
      category: String(formData.get("category") ?? ""),
      description: String(formData.get("description") ?? ""),
    });

    revalidatePath("/");
    revalidatePath("/requests");
    revalidatePath("/admin/requests");
    return { success: "Request was updated." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update request.",
    };
  }
}

export async function closeVendorRequestAction(
  requestId: string,
  _state: CloseRequestActionState,
  formData: FormData,
): Promise<CloseRequestActionState> {
  const admin = await getCurrentAdmin();

  if (!admin?.cohortId || !canManageCohort(admin, admin.cohortId)) {
    return { error: "Only cohort admins can close vendor requests." };
  }

  try {
    await closeVendorRequestForCohort({
      requestId,
      cohortId: admin.cohortId,
      adminNote: String(formData.get("adminNote") ?? ""),
    });

    revalidatePath("/");
    revalidatePath("/requests");
    revalidatePath("/admin/requests");
    return { success: "Request was closed." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not close request.",
    };
  }
}

export async function createInviteAction(
  _state: CreateInviteActionState,
  formData: FormData,
): Promise<CreateInviteActionState> {
  const admin = await getCurrentAdmin();

  if (!admin?.cohortId || !canManageCohort(admin, admin.cohortId)) {
    return { error: "Only cohort admins can create invites." };
  }

  try {
    const invite = await createInviteForCohort({
      cohortId: admin.cohortId,
      email: String(formData.get("email") ?? ""),
      invitedById: admin.id,
    });

    revalidatePath("/admin/requests");
    return {
      invitePath: `/invite/${invite.token}`,
      success: `Invite created for ${invite.email}.`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create invite.",
    };
  }
}

export async function revokeInviteAction(
  inviteId: string,
  _state: RevokeInviteActionState,
): Promise<RevokeInviteActionState> {
  void _state;

  const admin = await getCurrentAdmin();

  if (!admin?.cohortId || !canManageCohort(admin, admin.cohortId)) {
    return { error: "Only cohort admins can revoke invites." };
  }

  try {
    await revokeInviteForCohort({
      cohortId: admin.cohortId,
      inviteId,
    });

    revalidatePath("/admin/requests");
    return { success: "Invite was revoked." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not revoke invite.",
    };
  }
}
