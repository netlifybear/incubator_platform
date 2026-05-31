import type { BacklinkLog } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
    status = res.ok ? "verified" : "lost";
  } catch {
    try {
      const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(8000) });
      status = res.ok ? "verified" : "lost";
    } catch {
      status = "lost";
    }
  }

  return prisma.backlinkLog.update({
    where: { id },
    data: { status, lastCheckedAt: new Date() },
  });
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

  return results;
}
