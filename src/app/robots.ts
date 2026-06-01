import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://incubator-trust.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/founder/", "/founders", "/leaderboard/public", "/api/badge/"],
        disallow: ["/admin/", "/signin", "/api/auth/", "/api/reputation/", "/api/badges/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
