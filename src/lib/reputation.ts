import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getFounderPoints, getFounderCohortRank } from "@/lib/points";
import { getFounderBadges } from "@/lib/badges";
import { getAverageRating } from "@/lib/vendors";

const SHARED_SECRET = process.env.REPUTATION_SHARED_SECRET ?? "dev-secret-change-in-production";

export type ReputationPacket = {
  version: string;
  founderId: string;
  sourceIncubator: {
    id: string;
    name: string;
    verificationMethod: string;
  };
  attestations: ReputationAttestation[];
  aggregates: {
    avgVendorRating: number | null;
    totalReviews: number;
    totalBadges: number;
    totalPoints: number;
  };
  issuedAt: string;
  signature: string;
};

type ReputationAttestation = {
  type: string;
  value: boolean | string;
  label: string;
  icon?: string;
  issuedAt: string;
};

function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64").toString("utf-8");
}

function createSignature(payload: string): string {
  return crypto.createHmac("sha256", SHARED_SECRET).update(payload).digest("base64url");
}

function verifySignature(payload: string, signature: string): boolean {
  const expected = createSignature(payload);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function generateReputationPacket(founderId: string): Promise<ReputationPacket> {
  const founder = await prisma.user.findUnique({
    where: { id: founderId },
    select: {
      id: true,
      email: true,
      cohort: { select: { id: true, name: true } },
      reviews: { select: { rating: true } },
    },
  });

  if (!founder || !founder.cohort) {
    throw new Error("Founder not found or not in a cohort.");
  }

  const [points, badges, rank] = await Promise.all([
    getFounderPoints(founder.id),
    getFounderBadges(founder.email),
    getFounderCohortRank(founder.id, founder.cohort.id),
  ]);

  const attestations: ReputationAttestation[] = [
    {
      type: "verified_status",
      value: true,
      label: "Verified cohort member",
      issuedAt: new Date().toISOString(),
    },
    ...badges.map((b) => ({
      type: `badge_${b.type}`,
      value: b.label,
      label: b.label,
      icon: b.icon,
      issuedAt: new Date().toISOString(),
    })),
  ];

  if (rank) {
    attestations.push({
      type: "cohort_rank",
      value: `#${rank.rank} of ${rank.total}`,
      label: `Ranked #${rank.rank} in cohort`,
      issuedAt: new Date().toISOString(),
    });
  }

  const packet: Omit<ReputationPacket, "signature"> = {
    version: "1.0",
    founderId: founder.id,
    sourceIncubator: {
      id: founder.cohort.id,
      name: founder.cohort.name,
      verificationMethod: "email_verified + cohort_invite",
    },
    attestations,
    aggregates: {
      avgVendorRating: getAverageRating(founder.reviews),
      totalReviews: founder.reviews.length,
      totalBadges: badges.length,
      totalPoints: points.total,
    },
    issuedAt: new Date().toISOString(),
  };

  const payload = JSON.stringify(packet);
  const signature = createSignature(payload);

  return { ...packet, signature };
}

export function verifyReputationPacket(
  packet: ReputationPacket,
): { valid: boolean; error?: string } {
  if (!packet.version) {
    return { valid: false, error: "Missing version" };
  }

  if (!packet.sourceIncubator?.id) {
    return { valid: false, error: "Missing source incubator" };
  }

  const payload = JSON.stringify({
    version: packet.version,
    founderId: packet.founderId,
    sourceIncubator: packet.sourceIncubator,
    attestations: packet.attestations,
    aggregates: packet.aggregates,
    issuedAt: packet.issuedAt,
  });

  if (!verifySignature(payload, packet.signature)) {
    return { valid: false, error: "Invalid signature" };
  }

  return { valid: true };
}

export function reputationPacketToJwt(packet: ReputationPacket): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify(packet));
  const sig = base64UrlEncode(packet.signature);
  return `${header}.${payload}.${sig}`;
}

export function parseJwtToReputationPacket(jwt: string): ReputationPacket | null {
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;

  try {
    const payloadStr = base64UrlDecode(parts[1]);
    const packet = JSON.parse(payloadStr) as ReputationPacket;
    const sigStr = base64UrlDecode(parts[2]);
    packet.signature = sigStr;
    return packet;
  } catch {
    return null;
  }
}
