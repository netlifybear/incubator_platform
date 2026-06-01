import type { BacklinkLog } from "@prisma/client";
import { prisma } from "./prisma.ts";

export type BacklinkEntry = {
  id: string;
  referringDomain: string;
  targetUrl: string | null;
  status: string;
  lastCheckedAt: Date | null;
  discoveredAt: Date;
};

export async function listBacklinksForFounder(userId: string) {
  return prisma.backlinkLog.findMany({
    where: { userId },
    orderBy: { discoveredAt: "desc" },
    take: 50,
  });
}

export async function addBacklink(input: {
  userId: string;
  referringDomain: string;
  targetUrl?: string;
}) {
  const domain = normalizeReferringDomain(input.referringDomain);

  if (!domain) {
    throw new Error("A referring domain is required.");
  }

  const existing = await prisma.backlinkLog.findFirst({
    where: {
      userId: input.userId,
      referringDomain: domain,
    },
  });

  if (existing) {
    throw new Error("This domain is already tracked.");
  }

  return prisma.backlinkLog.create({
    data: {
      userId: input.userId,
      referringDomain: domain,
      targetUrl: input.targetUrl ?? null,
    },
  });
}

export async function removeBacklink(id: string, userId: string) {
  const entry = await prisma.backlinkLog.findFirst({
    where: { id, userId },
  });

  if (!entry) {
    throw new Error("Backlink entry not found.");
  }

  return prisma.backlinkLog.delete({ where: { id } });
}

export async function verifyBacklink(id: string, userId: string) {
  const entry = await prisma.backlinkLog.findFirst({
    where: { id, userId },
  });

  if (!entry) {
    throw new Error("Backlink entry not found.");
  }

  const url = `https://${entry.referringDomain}`;
  let status = "lost";

  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
    status = res.ok ? "reachable" : "lost";
  } catch {
    try {
      const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(8000) });
      status = res.ok ? "reachable" : "lost";
    } catch {
      status = "lost";
    }
  }

  if (status === "reachable" && entry.targetUrl) {
    const linkFound = await checkPageForLink(url, entry.targetUrl);
    status = linkFound ? "verified" : "reachable_no_link";
  }

  return prisma.backlinkLog.update({
    where: { id },
    data: { status, lastCheckedAt: new Date() },
  });
}

async function checkPageForLink(pageUrl: string, targetUrl: string): Promise<boolean> {
  try {
    const res = await fetch(pageUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return false;

    const html = await res.text();
    const normalizedTarget = targetUrl.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");

    const linkRegex = /<a[^>]+href=["']([^"']*)["'][^>]*>/gi;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1].toLowerCase();
      if (href.includes(normalizedTarget)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

function normalizeReferringDomain(value: string) {
  const raw = value.trim().toLowerCase();

  if (!raw) {
    return "";
  }

  const withoutProtocol = raw.replace(/^https?:\/\//, "").split("/")[0] ?? "";
  const domain = withoutProtocol.replace(/\.$/, "");

  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    throw new Error("Enter a public domain like example.com.");
  }

  if (
    domain === "localhost" ||
    domain.endsWith(".localhost") ||
    domain.endsWith(".local") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(domain)
  ) {
    throw new Error("Private or local domains cannot be tracked.");
  }

  return domain;
}

export async function verifyAllBacklinks(userId: string) {
  const entries = await prisma.backlinkLog.findMany({ where: { userId } });
  const results: BacklinkLog[] = [];

  for (const entry of entries) {
    try {
      const updated = await verifyBacklink(entry.id, userId);
      results.push(updated);
    } catch {
      // skip individual failures
    }
  }

  await snapshotBacklinks(userId);
  return results;
}

export async function snapshotBacklinks(userId: string) {
  const counts = await prisma.backlinkLog.groupBy({
    by: ["status"],
    where: { userId },
    _count: { id: true },
  });

  const verifiedCount = counts.find((c) => c.status === "verified")?._count.id ?? 0;
  const lostCount = counts.find((c) => c.status === "lost")?._count.id ?? 0;
  const reachableCount = counts.filter((c) => c.status === "reachable" || c.status === "reachable_no_link").reduce((s, c) => s + c._count.id, 0);
  const pendingCount = counts.find((c) => c.status === "pending")?._count.id ?? 0;

  return prisma.backlinkSnapshot.create({
    data: { userId, verifiedCount, lostCount, reachableCount, pendingCount },
  });
}

export async function getBacklinkSnapshots(userId: string) {
  return prisma.backlinkSnapshot.findMany({
    where: { userId },
    orderBy: { snapshotAt: "asc" },
  });
}
