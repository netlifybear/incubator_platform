import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const founders = await prisma.user.findMany({
    where: { publicProfileEnabled: true, profileSlug: { not: null } },
    select: {
      profileSlug: true,
      updatedAt: true,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://incubator-trust.vercel.app";

  const publicFounders = founders
    .filter((f): f is { profileSlug: string; updatedAt: Date } => f.profileSlug !== null)
  const founderEntries: MetadataRoute.Sitemap = publicFounders.flatMap((f) => [
    {
      url: `${baseUrl}/founder/${f.profileSlug}`,
      lastModified: f.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/founder/${f.profileSlug}/credibility`,
      lastModified: f.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    },
  ]);

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/founders`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/leaderboard/public`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    ...founderEntries,
  ];
}
