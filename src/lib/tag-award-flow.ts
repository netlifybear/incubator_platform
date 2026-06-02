import { contributionTagDefinition } from "../config/contribution-tag-definitions.ts";
import { awardTag } from "./contribution-tags.ts";
import {
  type TagAwardIssuerType,
  isTagAwardRateLimited,
  recordTagAwardAttempt,
} from "./tag-award-attempts.ts";
import { fingerprintIssuerSecret, hashIssuerSecret } from "./issuer-secrets.ts";
import { prisma } from "./prisma.ts";

type ExternalTagAwardBody = {
  tagType?: unknown;
  description?: unknown;
  founderEmail?: unknown;
  secret?: unknown;
};

export type ExternalTagAwardResult = {
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

function issuerLabel(issuerType: TagAwardIssuerType) {
  return issuerType === "vendor" ? "vendor" : "investor";
}

async function fail(input: {
  ipAddress?: string | null;
  issuerType: TagAwardIssuerType;
  message: string;
  secretHash: string;
  status: number;
}): Promise<ExternalTagAwardResult> {
  await recordTagAwardAttempt({
    error: input.message,
    ipAddress: input.ipAddress,
    issuerType: input.issuerType,
    secretHash: input.secretHash,
    success: false,
  });

  return { body: { error: input.message }, status: input.status };
}

export async function handleExternalTagAward(input: {
  body: ExternalTagAwardBody;
  ipAddress?: string | null;
  issuerType: TagAwardIssuerType;
}): Promise<ExternalTagAwardResult> {
  const founderEmail = stringValue(input.body.founderEmail).toLowerCase().trim();
  const tagType = stringValue(input.body.tagType);
  const secret = stringValue(input.body.secret);
  const description = stringValue(input.body.description);

  if (!founderEmail || !tagType || !secret) {
    return {
      body: { error: "Missing required fields: founderEmail, tagType, secret" },
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

  if (await isTagAwardRateLimited(input.issuerType, attemptSecretHash)) {
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
          where: { tagAwardSecret: hashedSecret },
          select: { cohortId: true, id: true, name: true },
        })
      : await prisma.investor.findFirst({
          where: { tagAwardSecret: hashedSecret },
          select: { company: true, id: true, name: true },
        });

  if (!issuer) {
    return failWithAttempt(`Invalid or expired ${issuerLabel(input.issuerType)} award secret.`, 401);
  }

  const def = contributionTagDefinition(tagType);
  const canAward =
    input.issuerType === "vendor" ? def?.awardableByVendor : def?.awardableByInvestor;

  if (!def || !canAward) {
    return failWithAttempt(
      `Tag type "${tagType}" cannot be awarded by ${issuerLabel(input.issuerType)}s.`,
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

  if (founder.role !== "founder" && founder.role !== "alumni") {
    return failWithAttempt(
      input.issuerType === "vendor"
        ? "This founder is not in the same cohort as the vendor."
        : "Investor tags can only be awarded to founders.",
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

  await awardTag(
    founder.id,
    tagType,
    description || defaultDescription,
    input.issuerType,
    issuer.id,
  );

  await recordTagAwardAttempt({
    ipAddress: input.ipAddress,
    issuerType: input.issuerType,
    secretHash: attemptSecretHash,
    success: true,
  });

  return {
    body: {
      message: `${tagType} tag awarded to ${founder.name ?? founderEmail} by ${issuer.name}.`,
      success: true,
    },
    status: 200,
  };
}
