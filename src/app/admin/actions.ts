"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
