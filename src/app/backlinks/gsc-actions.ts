"use server";

import { revalidatePath } from "next/cache";
import { getCurrentFounder } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listGscSites, fetchTopLinkingDomains } from "@/lib/gsc";
import { addBacklink } from "@/lib/backlinks";

export type GscImportState = {
  error?: string;
  success?: string;
  imported?: number;
  skipped?: number;
  sites?: Array<{ siteUrl: string; imported: number; skipped: number }>;
};

export async function importGscLinksAction(
  _state: GscImportState,
  formData: FormData,
): Promise<GscImportState> {
  const founder = await getCurrentFounder();
  if (!founder) {
    return { error: "You must be signed in." };
  }

  const accessToken = founder.gscAccessToken;
  if (!accessToken) {
    return { error: "Google Search Console is not connected." };
  }

  try {
    const sites = await listGscSites(accessToken);
    if (sites.length === 0) {
      return { success: "No verified sites found in your Search Console.", imported: 0, skipped: 0 };
    }

    const results: GscImportState["sites"] = [];

    for (const site of sites) {
      const links = await fetchTopLinkingDomains(accessToken, site.siteUrl);
      let imported = 0;
      let skipped = 0;

      for (const link of links) {
        try {
          await addBacklink({
            userId: founder.id,
            referringDomain: link.referringDomain,
            targetUrl: site.siteUrl,
          });
          imported++;
        } catch {
          skipped++;
        }
      }

      if (links.length > 0) {
        results.push({ siteUrl: site.siteUrl, imported, skipped });
      }
    }

    revalidatePath("/backlinks");
    return {
      success: `Imported ${results.reduce((s, r) => s + r.imported, 0)} new domains.`,
      imported: results.reduce((s, r) => s + r.imported, 0),
      skipped: results.reduce((s, r) => s + r.skipped, 0),
      sites: results,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("401") ||
      error instanceof Error &&
      error.message.includes("403")
    ) {
      // Token expired — try to refresh
      try {
        await refreshGscToken(founder.id, founder.gscRefreshToken);
        // Retry once
        return importGscLinksAction({}, formData);
      } catch {
        return { error: "GSC connection expired. Please reconnect." };
      }
    }
    return {
      error: error instanceof Error ? error.message : "Import failed.",
    };
  }
}

async function refreshGscToken(userId: string, refreshToken: string | null) {
  if (!refreshToken) throw new Error("No refresh token available.");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID!,
      client_secret: process.env.AUTH_GOOGLE_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) throw new Error("Token refresh failed");

  const data = await res.json() as { access_token: string };

  await prisma.user.update({
    where: { id: userId },
    data: { gscAccessToken: data.access_token },
  });
}

export async function disconnectGscAction(): Promise<GscImportState> {
  const founder = await getCurrentFounder();
  if (!founder) return { error: "Not signed in." };

  await prisma.user.update({
    where: { id: founder.id },
    data: { gscAccessToken: null, gscRefreshToken: null, gscEmail: null },
  });

  revalidatePath("/backlinks");
  return { success: "Google Search Console disconnected." };
}
