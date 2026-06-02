import crypto from "node:crypto";
import { prisma } from "./prisma.ts";
import { getFounderPoints, getFounderCohortRank } from "./points.ts";
import { getFounderBadges } from "./badges.ts";
import { getAverageRating } from "./vendors.ts";

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

function getKeyPair(): { publicKey: string; privateKey: string } | null {
  const privateKey = process.env.REPUTATION_PRIVATE_KEY;
  const publicKey = process.env.REPUTATION_PUBLIC_KEY;
  if (privateKey && publicKey) return { publicKey, privateKey };
  return null;
}

function signEd25519(payload: string, privateKeyPem: string): string {
  const key = crypto.createPrivateKey({ key: privateKeyPem, format: "pem", type: "pkcs8" });
  return crypto.sign(null, Buffer.from(payload), key).toString("base64url");
}

function verifyEd25519(payload: string, signature: string, publicKeyPem: string): boolean {
  try {
    const key = crypto.createPublicKey({ key: publicKeyPem, format: "pem", type: "spki" });
    return crypto.verify(null, Buffer.from(payload), key, Buffer.from(signature, "base64url"));
  } catch {
    return false;
  }
}

function signHmac(payload: string): string {
  return crypto.createHmac("sha256", SHARED_SECRET).update(payload).digest("base64url");
}

function verifyHmac(payload: string, signature: string): boolean {
  const expected = signHmac(payload);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function fetchPublicKeyFromIssuer(issuerUrl: string): Promise<string | null> {
  const wellKnownUrl = `${issuerUrl.replace(/\/$/, "")}/.well-known/reputation-public-key`;

  try {
    const response = await fetch(wellKnownUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const text = await response.text();
    if (!text.includes("BEGIN PUBLIC KEY")) return null;
    return text;
  } catch {
    return null;
  }
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
    version: "1.1",
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
  const keyPair = getKeyPair();
  const signature = keyPair
    ? signEd25519(payload, keyPair.privateKey)
    : signHmac(payload);

  return { ...packet, signature };
}

export async function verifyReputationPacket(
  packet: ReputationPacket,
): Promise<{ valid: boolean; error?: string }> {
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

  const keyPair = getKeyPair();
  if (keyPair) {
    const valid = verifyEd25519(payload, packet.signature, keyPair.publicKey);
    if (valid) return { valid: true };

    return {
      valid: false,
      error: "Invalid signature; cross-instance public-key verification is not configured.",
    };
  }

  if (!verifyHmac(payload, packet.signature)) {
    return { valid: false, error: "Invalid signature" };
  }

  return { valid: true };
}

export function reputationPacketToJwt(packet: ReputationPacket): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "Ed25519", typ: "JWT" }));
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
