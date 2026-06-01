import { prisma } from "./prisma.ts";

export async function listVendorsForCohort(cohortId: string, category?: string) {
  return prisma.vendor.findMany({
    where: {
      cohortId,
      ...(category ? { category } : {}),
    },
    include: {
      reviews: {
        select: { rating: true },
      },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function searchVendorsForCohort(input: {
  cohortId: string;
  query?: string;
  category?: string;
  sort?: "name" | "rating" | "trending" | "reviews";
}) {
  const vendors = await prisma.vendor.findMany({
    where: {
      cohortId: input.cohortId,
      ...(input.category ? { category: input.category } : {}),
      ...(input.query
        ? {
            OR: [
              { name: { contains: input.query, mode: "insensitive" } },
              { category: { contains: input.query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      reviews: {
        select: { rating: true },
      },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  if (input.sort === "rating") {
    return vendors.sort((a, b) => {
      const aAvg = getAverageRating(a.reviews) ?? 0;
      const bAvg = getAverageRating(b.reviews) ?? 0;
      return bAvg - aAvg;
    });
  }

  if (input.sort === "trending") {
    return vendors.sort((a, b) => {
      return getVendorAuthorityScore(b.reviews) - getVendorAuthorityScore(a.reviews);
    });
  }

  if (input.sort === "reviews") {
    return vendors.sort((a, b) => b.reviews.length - a.reviews.length);
  }

  return vendors;
}

export async function listVendorCategoriesForCohort(cohortId: string) {
  const vendors = await prisma.vendor.findMany({
    where: { cohortId },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  return vendors.map((vendor) => vendor.category);
}

export async function getPublicVendor(vendorId: string) {
  return prisma.vendor.findUnique({
    where: { id: vendorId },
    select: {
      id: true,
      name: true,
      category: true,
      contact: true,
      cohortId: true,
      cohort: {
        select: { name: true },
      },
    },
  });
}

export async function getVendorForCohort(vendorId: string, cohortId: string) {
  return prisma.vendor.findFirst({
    where: {
      id: vendorId,
      cohortId,
    },
    include: {
      cohort: {
        select: { name: true },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          helpfulVotes: {
            select: {
              userId: true,
              value: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export async function getConsumerReviewsForVendor(vendorId: string) {
  return prisma.consumerReview.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
  });
}

export function getAverageRating(reviews: Array<{ rating: number }>) {
  if (reviews.length === 0) {
    return null;
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / reviews.length;
}

export function getVendorAuthorityScore(reviews: Array<{ rating: number }>): number {
  if (reviews.length === 0) return 0;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const reviewBonus = Math.min(reviews.length / 10, 1) * 5;
  return avg * 0.7 + reviewBonus * 0.3;
}

export function formatVendorAuthorityScore(score: number) {
  if (score >= 4.5) return { label: "Top Rated", tier: "platinum" as const };
  if (score >= 3.5) return { label: "Highly Rated", tier: "gold" as const };
  if (score >= 2.5) return { label: "Rated", tier: "silver" as const };
  if (score > 0) return { label: "Newly Rated", tier: "bronze" as const };
  return { label: "Unrated", tier: "none" as const };
}
