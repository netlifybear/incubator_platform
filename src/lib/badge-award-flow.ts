import { badgeDefinition } from "../config/badge-definitions.ts";
import { awardBadge } from "./badges.ts";
import {
  type BadgeAwardIssuerType,
  isBadgeAwardRateLimited,
  recordBadgeAwardAttempt,
} from "./badge-award-attempts.ts";
import { fingerprintIssuerSecret, hashIssuerSecret } from "./issuer-secrets.ts";
import { prisma } from "./prisma.ts";

type ExternalBadgeAwardBody = {
  badgeType?: unknown;
  description?: unknown;
  founderEmail?: unknown;
  secret?: unknown;
};

export type ExternalBadgeAwardResult = {
  body: {
    error?: string;
    message?: string;
    success?: boolean;
  };
  status: number;
};

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function issuerLabel(issuerType: BadgeAwardIssuerType) {
  return issuerType === "vendor" ? "vendor" : "investor";
}

async function fail(input: {
  ipAddress?: string | null;
  issuerType: BadgeAwardIssuerType;
  message: string;
  secretHash: string;
  status: number;
}): Promise<ExternalBadgeAwardResult> {
  await recordBadgeAwardAttempt({
    error: input.message,
    ipAddress: input.ipAddress,
    issuerType: input.issuerType,
    secretHash: input.secretHash,
    success: false,
  });

  return { body: { error: input.message }, status: input.status };
}

export async function handleExternalBadgeAward(input: {
  body: ExternalBadgeAwardBody;
  ipAddress?: string | null;
  issuerType: BadgeAwardIssuerType;
}): Promise<ExternalBadgeAwardResult> {
  const founderEmail = stringValue(input.body.founderEmail).toLowerCase().trim();
  const badgeType = stringValue(input.body.badgeType);
  const secret = stringValue(input.body.secret);
  const description = stringValue(input.body.description);

  if (!founderEmail || !badgeType || !secret) {
    return {
      body: { error: "Missing required fields: founderEmail, badgeType, secret" },
      status: 400,
    };
  }

  const attemptSecretHash = fingerprintIssuerSecret(secret);
  const failWithAttempt = (message: string, status: number) =>
    fail({
      ipAddress: input.ipAddress,
      issuerType: input.issuerType,
      message,
      secretHash: attemptSecretHash,
      status,
    });

  if (await isBadgeAwardRateLimited(input.issuerType, attemptSecretHash)) {
    return failWithAttempt(
      `Too many failed ${issuerLabel(input.issuerType)} award attempts. Try again later.`,
      429,
    );
  }

  let hashedSecret: string;
  try {
    hashedSecret = hashIssuerSecret(secret);
  } catch {
    return failWithAttempt(`Invalid or expired ${issuerLabel(input.issuerType)} award secret.`, 401);
  }

  const issuer =
    input.issuerType === "vendor"
      ? await prisma.vendor.findFirst({
          where: { badgeAwardSecret: hashedSecret },
          select: { cohortId: true, id: true, name: true },
        })
      : await prisma.investor.findFirst({
          where: { badgeAwardSecret: hashedSecret },
          select: { company: true, id: true, name: true },
        });

  if (!issuer) {
    return failWithAttempt(`Invalid or expired ${issuerLabel(input.issuerType)} award secret.`, 401);
  }

  const def = badgeDefinition(badgeType);
  const canAward =
    input.issuerType === "vendor" ? def?.awardableByVendor : def?.awardableByInvestor;

  if (!def || !canAward) {
    return failWithAttempt(
      `Badge type "${badgeType}" cannot be awarded by ${issuerLabel(input.issuerType)}s.`,
      400,
    );
  }

  const founder = await prisma.user.findUnique({
    where: { email: founderEmail },
    select: { cohortId: true, id: true, name: true, role: true },
  });

  if (!founder) {
    return failWithAttempt("No founder found with that email address.", 404);
  }

  if (founder.role !== "founder") {
    return failWithAttempt(
      input.issuerType === "vendor"
        ? "This founder is not in the same cohort as the vendor."
        : "Investor badges can only be awarded to founders.",
      400,
    );
  }

  if (
    input.issuerType === "vendor" &&
    (!("cohortId" in issuer) || founder.cohortId !== issuer.cohortId)
  ) {
    return failWithAttempt("This founder is not in the same cohort as the vendor.", 400);
  }

  const defaultDescription =
    input.issuerType === "vendor"
      ? `Awarded by vendor: ${issuer.name}`
      : `Awarded by investor: ${issuer.name}${"company" in issuer && issuer.company ? ` (${issuer.company})` : ""}`;

  await awardBadge(
    founder.id,
    badgeType,
    description || defaultDescription,
    input.issuerType,
    issuer.id,
  );

  await recordBadgeAwardAttempt({
    ipAddress: input.ipAddress,
    issuerType: input.issuerType,
    secretHash: attemptSecretHash,
    success: true,
  });

  return {
    body: {
      message: `${badgeType} badge awarded to ${founder.name ?? founderEmail} by ${issuer.name}.`,
      success: true,
    },
    status: 200,
  };
}
