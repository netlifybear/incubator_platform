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
        select: { name: true, slug: true },
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
        select: { name: true, slug: true },
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

export async function getCrossCohortRecommendations(excludeCohortId: string, limit = 5) {
  const vendors = await prisma.vendor.findMany({
    where: {
      cohortId: { not: excludeCohortId },
    },
    select: {
      id: true,
      name: true,
      category: true,
      cohort: {
        select: { name: true, slug: true },
      },
      reviews: {
        select: { rating: true },
      },
    },
  });

  const withReviews = vendors.filter((v) => v.reviews.length > 0);
  const scored = withReviews
    .map((v) => ({
      id: v.id,
      name: v.name,
      category: v.category,
      cohortName: v.cohort.name,
      cohortSlug: v.cohort.slug,
      reviewCount: v.reviews.length,
      avgRating: v.reviews.reduce((s, r) => s + r.rating, 0) / v.reviews.length,
    }))
    .filter((v) => v.avgRating >= 3.5)
    .sort((a, b) => {
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);

  return scored;
}

export async function getSimilarVendorsInOtherCohorts(
  vendorId: string,
  excludeCohortId: string,
  limit = 5,
) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { category: true },
  });
  if (!vendor) return [];

  const vendors = await prisma.vendor.findMany({
    where: {
      cohortId: { not: excludeCohortId },
      category: vendor.category,
      id: { not: vendorId },
    },
    select: {
      id: true,
      name: true,
      category: true,
      cohort: {
        select: { name: true, slug: true },
      },
      reviews: {
        select: { rating: true },
      },
    },
  });

  return vendors
    .filter((v) => v.reviews.length > 0)
    .map((v) => ({
      id: v.id,
      name: v.name,
      category: v.category,
      cohortName: v.cohort.name,
      cohortSlug: v.cohort.slug,
      reviewCount: v.reviews.length,
      avgRating: v.reviews.reduce((s, r) => s + r.rating, 0) / v.reviews.length,
    }))
    .filter((v) => v.avgRating >= 3.5)
    .sort((a, b) => {
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}
