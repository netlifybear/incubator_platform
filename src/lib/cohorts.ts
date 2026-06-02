import { prisma } from "./prisma.ts";

export type PublicCohortSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: {
    users: number;
    vendors: number;
    reviews: number;
    consumerReviews: number;
  };
};

export async function listPublicCohorts(): Promise<PublicCohortSummary[]> {
  const cohorts = await prisma.cohort.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          users: true,
          vendors: true,
          reviews: true,
          consumerReviews: true,
        },
      },
    },
  });

  return cohorts.map((c) => ({
    ...c,
    _count: {
      ...c._count,
      reviews: c._count.reviews,
      consumerReviews: c._count.consumerReviews,
    },
  }));
}

export type PublicCohortDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    users: number;
    vendors: number;
    reviews: number;
    consumerReviews: number;
    sprints: number;
  };
  topVendors: Array<{
    id: string;
    name: string;
    category: string;
    reviewCount: number;
    avgRating: number | null;
  }>;
};

export async function getPublicCohortBySlug(slug: string): Promise<PublicCohortDetail | null> {
  const cohort = await prisma.cohort.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          users: true,
          vendors: true,
          reviews: true,
          consumerReviews: true,
          sprints: true,
        },
      },
      vendors: {
        select: {
          id: true,
          name: true,
          category: true,
          reviews: {
            select: { rating: true },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!cohort) return null;

  const vendorsWithCounts = cohort.vendors
    .map((v) => ({
      id: v.id,
      name: v.name,
      category: v.category,
      reviewCount: v.reviews.length,
      avgRating:
        v.reviews.length > 0
          ? v.reviews.reduce((sum, r) => sum + r.rating, 0) / v.reviews.length
          : null,
    }))
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 10);

  return {
    id: cohort.id,
    name: cohort.name,
    slug: cohort.slug,
    description: cohort.description,
    createdAt: cohort.createdAt,
    updatedAt: cohort.updatedAt,
    _count: cohort._count,
    topVendors: vendorsWithCounts,
  };
}
