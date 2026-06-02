"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export type CreateCohortState = { error?: string; success?: string };

export async function createCohortAction(
  _state: CreateCohortState,
  formData: FormData,
): Promise<CreateCohortState> {
  const admin = await getCurrentAdmin();
  if (!admin?.cohortId) return { error: "Unauthorized" };

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name || !slug) return { error: "Name and slug are required." };

  const existing = await prisma.cohort.findUnique({ where: { slug } });
  if (existing) return { error: "A cohort with that slug already exists." };

  await prisma.cohort.create({ data: { name, slug, description } });
  revalidatePath("/admin/cohorts");
  return { success: `Cohort "${name}" created.` };
}

export type CohortPolicyState = { error?: string; success?: string };

export async function updateCohortTrustPolicyAction(
  _state: CohortPolicyState,
  formData: FormData,
): Promise<CohortPolicyState> {
  const admin = await getCurrentAdmin();
  if (!admin?.cohortId) return { error: "Unauthorized" };

  const cohortId = formData.get("cohortId") as string;
  const trustPolicy = String(formData.get("defaultTrustPolicy") ?? "all").trim();

  if (!cohortId) return { error: "Cohort ID required." };
  if (!["all", "badges_only", "points_only"].includes(trustPolicy)) {
    return { error: "Invalid trust policy." };
  }

  const cohort = await prisma.cohort.findFirst({
    where: { id: cohortId },
    select: { id: true, name: true },
  });
  if (!cohort) return { error: "Cohort not found." };

  await prisma.cohort.update({
    where: { id: cohortId },
    data: { defaultTrustPolicy: trustPolicy },
  });

  revalidatePath("/admin/cohorts");
  return { success: `Default trust policy for "${cohort.name}" set to "${trustPolicy}".` };
}

export type DeleteReviewState = { error?: string; success?: string };

export async function deleteConsumerReviewAction(
  _state: DeleteReviewState,
  formData: FormData,
): Promise<DeleteReviewState> {
  const admin = await getCurrentAdmin();
  if (!admin?.cohortId) return { error: "Unauthorized" };

  const reviewId = formData.get("reviewId") as string;
  if (!reviewId) return { error: "Review ID required." };

  const review = await prisma.consumerReview.findFirst({
    where: { id: reviewId, cohortId: admin.cohortId },
    select: { id: true },
  });
  if (!review) return { error: "Review not found for this cohort." };

  await prisma.consumerReview.delete({ where: { id: review.id } });
  revalidatePath("/admin/reviews");
  return { success: "Review deleted." };
}

export async function deleteReviewAction(
  _state: DeleteReviewState,
  formData: FormData,
): Promise<DeleteReviewState> {
  const admin = await getCurrentAdmin();
  if (!admin?.cohortId) return { error: "Unauthorized" };

  const reviewId = formData.get("reviewId") as string;
  if (!reviewId) return { error: "Review ID required." };

  const review = await prisma.review.findFirst({
    where: { id: reviewId, cohortId: admin.cohortId },
    select: { id: true },
  });
  if (!review) return { error: "Review not found for this cohort." };

  await prisma.review.delete({ where: { id: review.id } });
  revalidatePath("/admin/reviews");
  return { success: "Founder review deleted." };
}

export type VendorFormState = { error?: string; success?: string };

export async function createVendorAction(
  _state: VendorFormState,
  formData: FormData,
): Promise<VendorFormState> {
  const admin = await getCurrentAdmin();
  if (!admin?.cohortId) return { error: "Unauthorized" };

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim() || null;

  if (!name || !category) return { error: "Name and category are required." };

  await prisma.vendor.create({
    data: { name, category, contact, cohortId: admin.cohortId },
  });

  revalidatePath("/admin/vendors");
  return { success: `Vendor "${name}" created.` };
}

export async function deleteVendorAction(
  _state: VendorFormState,
  formData: FormData,
): Promise<VendorFormState> {
  const admin = await getCurrentAdmin();
  if (!admin?.cohortId) return { error: "Unauthorized" };

  const vendorId = formData.get("vendorId") as string;
  if (!vendorId) return { error: "Vendor ID required." };

  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, cohortId: admin.cohortId },
    select: { id: true },
  });
  if (!vendor) return { error: "Vendor not found for this cohort." };

  await prisma.vendor.delete({ where: { id: vendor.id } });
  revalidatePath("/admin/vendors");
  return { success: "Vendor deleted." };
}

export type ImportActionState = { error?: string; success?: string };

export async function approveImportAction(
  _state: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const admin = await getCurrentAdmin();
  if (!admin?.cohortId) return { error: "Unauthorized" };

  const importId = formData.get("importId") as string;
  const trustPolicy = String(formData.get("trustPolicy") ?? "all").trim();

  if (!importId) return { error: "Import ID required." };
  if (!["all", "badges_only", "points_only"].includes(trustPolicy)) {
    return { error: "Invalid trust policy." };
  }

  const reputationImport = await prisma.reputationImport.findFirst({
    where: {
      id: importId,
      user: { cohortId: admin.cohortId },
    },
    select: { id: true, userId: true, status: true, sourceName: true },
  });

  if (!reputationImport) return { error: "Import not found." };
  if (reputationImport.status !== "pending") return { error: "Import is not pending." };

  await prisma.reputationImport.update({
    where: { id: importId },
    data: {
      status: "approved",
      approvedAt: new Date(),
      approvedBy: admin.name ?? admin.email ?? admin.id,
      trustPolicy,
    },
  });

  createNotification({
    userId: reputationImport.userId,
    type: "reputation_import",
    title: "Reputation import approved",
    body: `Your reputation import from ${reputationImport.sourceName} has been approved.`,
    link: "/grow",
  }).catch(() => {});

  revalidatePath("/admin/imports");
  return { success: `Import approved (policy: ${trustPolicy}).` };
}

export async function rejectImportAction(
  _state: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const admin = await getCurrentAdmin();
  if (!admin?.cohortId) return { error: "Unauthorized" };

  const importId = formData.get("importId") as string;
  const reason = String(formData.get("reason") ?? "").trim() || "No reason provided.";

  if (!importId) return { error: "Import ID required." };

  const reputationImport = await prisma.reputationImport.findFirst({
    where: {
      id: importId,
      user: { cohortId: admin.cohortId },
    },
    select: { id: true, userId: true, status: true, sourceName: true },
  });

  if (!reputationImport) return { error: "Import not found." };
  if (reputationImport.status !== "pending") return { error: "Import is not pending." };

  await prisma.reputationImport.update({
    where: { id: importId },
    data: {
      status: "rejected",
      approvedAt: new Date(),
      approvedBy: admin.name ?? admin.email ?? admin.id,
      rejectionReason: reason,
    },
  });

  createNotification({
    userId: reputationImport.userId,
    type: "reputation_import",
    title: "Reputation import rejected",
    body: `Your reputation import from ${reputationImport.sourceName} was rejected. Reason: ${reason}`,
    link: "/grow",
  }).catch(() => {});

  revalidatePath("/admin/imports");
  return { success: "Import rejected." };
}

export type UserRoleState = { error?: string; success?: string };

export async function graduateToAlumniAction(
  _state: UserRoleState,
  formData: FormData,
): Promise<UserRoleState> {
  const admin = await getCurrentAdmin();
  if (!admin?.cohortId) return { error: "Unauthorized" };

  const userId = formData.get("userId") as string;
  if (!userId) return { error: "User ID required." };

  const user = await prisma.user.findFirst({
    where: { id: userId, cohortId: admin.cohortId },
    select: { id: true, name: true, role: true },
  });
  if (!user) return { error: "User not found in your cohort." };
  if (user.role === "alumni") return { error: "User is already alumni." };
  if (user.role === "admin") return { error: "Cannot graduate an admin." };

  await prisma.user.update({
    where: { id: userId },
    data: { role: "alumni" },
  });

  revalidatePath("/admin/users");
  return { success: `"${user.name ?? "User"}" graduated to alumni.` };
}

export async function restoreFounderAction(
  _state: UserRoleState,
  formData: FormData,
): Promise<UserRoleState> {
  const admin = await getCurrentAdmin();
  if (!admin?.cohortId) return { error: "Unauthorized" };

  const userId = formData.get("userId") as string;
  if (!userId) return { error: "User ID required." };

  const user = await prisma.user.findFirst({
    where: { id: userId, cohortId: admin.cohortId },
    select: { id: true, name: true, role: true },
  });
  if (!user) return { error: "User not found in your cohort." };
  if (user.role !== "alumni") return { error: "User is not an alumni." };

  await prisma.user.update({
    where: { id: userId },
    data: { role: "founder" },
  });

  revalidatePath("/admin/users");
  return { success: `"${user.name ?? "User"}" restored to founder.` };
}
