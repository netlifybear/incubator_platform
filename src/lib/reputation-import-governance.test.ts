import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "./prisma.ts";
import { createTestCohort, createTestFounder, cleanupTestData, testRunId } from "./test-db.ts";
import { generateReputationPacket } from "./reputation.ts";
import { reputationPacketToJwt, parseJwtToReputationPacket, verifyReputationPacket } from "./reputation.ts";

describe("reputation import governance", () => {
  const runId = testRunId("impgov");
  let cohortId: string;
  let founderId: string;

  before(async () => {
    const cohort = await createTestCohort(`impgov-${runId}`);
    cohortId = cohort.id;
    const founder = await createTestFounder({
      cohortId,
      email: `founder-${runId}@test.com`,
      name: "Import Founder",
    });
    founderId = founder.id;
    const admin = await createTestFounder({
      cohortId,
      email: `admin-${runId}@test.com`,
      name: "Import Admin",
      role: "admin",
    });
    assert.ok(admin.id);
  });

  after(async () => {
    await cleanupTestData({
      cohortSlugs: [`impgov-${runId}`],
      emails: [`founder-${runId}@test.com`, `admin-${runId}@test.com`],
    });
  });

  it("creates a pending reputation import", async () => {
    const packet = await generateReputationPacket(founderId);
    const jwt = reputationPacketToJwt(packet);

    const parsed = parseJwtToReputationPacket(jwt);
    assert.ok(parsed);

    const { valid } = await verifyReputationPacket(parsed!);
    assert.ok(valid);

    const imp = await prisma.reputationImport.create({
      data: {
        sourceInstance: parsed!.sourceIncubator.id,
        sourceName: parsed!.sourceIncubator.name,
        founderId: parsed!.founderId,
        packetJson: JSON.stringify(parsed),
        signature: parsed!.signature,
        userId: founderId,
        status: "pending",
        trustPolicy: "all",
      },
    });

    assert.ok(imp.id);
    assert.equal(imp.status, "pending");
    assert.equal(imp.trustPolicy, "all");
    assert.equal(imp.userId, founderId);

    await prisma.reputationImport.delete({ where: { id: imp.id } });
  });

  it("admin can approve a pending import", async () => {
    const packet = await generateReputationPacket(founderId);
    const jwt = reputationPacketToJwt(packet);
    const parsed = parseJwtToReputationPacket(jwt)!;

    const imp = await prisma.reputationImport.create({
      data: {
        sourceInstance: parsed.sourceIncubator.id,
        sourceName: parsed.sourceIncubator.name,
        founderId: parsed.founderId,
        packetJson: JSON.stringify(parsed),
        signature: parsed.signature,
        userId: founderId,
        status: "pending",
      },
    });

    await prisma.reputationImport.update({
      where: { id: imp.id },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: "Admin Test",
        trustPolicy: "badges_only",
      },
    });

    const updated = await prisma.reputationImport.findUnique({ where: { id: imp.id } });
    assert.equal(updated?.status, "approved");
    assert.equal(updated?.approvedBy, "Admin Test");
    assert.equal(updated?.trustPolicy, "badges_only");
    assert.ok(updated?.approvedAt);

    await prisma.reputationImport.delete({ where: { id: imp.id } });
  });

  it("admin can reject a pending import", async () => {
    const packet = await generateReputationPacket(founderId);
    const jwt = reputationPacketToJwt(packet);
    const parsed = parseJwtToReputationPacket(jwt)!;

    const imp = await prisma.reputationImport.create({
      data: {
        sourceInstance: parsed.sourceIncubator.id,
        sourceName: parsed.sourceIncubator.name,
        founderId: parsed.founderId,
        packetJson: JSON.stringify(parsed),
        signature: parsed.signature,
        userId: founderId,
        status: "pending",
      },
    });

    await prisma.reputationImport.update({
      where: { id: imp.id },
      data: {
        status: "rejected",
        approvedAt: new Date(),
        approvedBy: "Admin Test",
        rejectionReason: "Duplicate credentials",
      },
    });

    const updated = await prisma.reputationImport.findUnique({ where: { id: imp.id } });
    assert.equal(updated?.status, "rejected");
    assert.equal(updated?.rejectionReason, "Duplicate credentials");

    await prisma.reputationImport.delete({ where: { id: imp.id } });
  });

  it("approved import gets notification for founder", async () => {
    const packet = await generateReputationPacket(founderId);
    const jwt = reputationPacketToJwt(packet);
    const parsed = parseJwtToReputationPacket(jwt)!;

    const imp = await prisma.reputationImport.create({
      data: {
        sourceInstance: parsed.sourceIncubator.id,
        sourceName: parsed.sourceIncubator.name,
        founderId: parsed.founderId,
        packetJson: JSON.stringify(parsed),
        signature: parsed.signature,
        userId: founderId,
        status: "pending",
      },
    });

    await prisma.reputationImport.update({
      where: { id: imp.id },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: "Admin Test",
      },
    });

    await prisma.notification.create({
      data: {
        userId: founderId,
        type: "reputation_import",
        title: "Reputation import approved",
        body: `Your reputation import from ${parsed.sourceIncubator.name} has been approved.`,
        link: "/grow",
      },
    });

    const notif = await prisma.notification.findFirst({
      where: { userId: founderId, type: "reputation_import" },
      orderBy: { createdAt: "desc" },
    });
    assert.ok(notif);
    assert.ok(notif!.title.includes("approved"));

    await prisma.notification.deleteMany({ where: { userId: founderId, type: "reputation_import" } });
    await prisma.reputationImport.delete({ where: { id: imp.id } });
  });

  it("rejected import gets notification for founder", async () => {
    const packet = await generateReputationPacket(founderId);
    const jwt = reputationPacketToJwt(packet);
    const parsed = parseJwtToReputationPacket(jwt)!;

    const imp = await prisma.reputationImport.create({
      data: {
        sourceInstance: parsed.sourceIncubator.id,
        sourceName: parsed.sourceIncubator.name,
        founderId: parsed.founderId,
        packetJson: JSON.stringify(parsed),
        signature: parsed.signature,
        userId: founderId,
        status: "pending",
      },
    });

    await prisma.reputationImport.update({
      where: { id: imp.id },
      data: {
        status: "rejected",
        approvedAt: new Date(),
        approvedBy: "Admin Test",
        rejectionReason: "Insufficient proof",
      },
    });

    await prisma.notification.create({
      data: {
        userId: founderId,
        type: "reputation_import",
        title: "Reputation import rejected",
        body: `Your reputation import from ${parsed.sourceIncubator.name} was rejected. Reason: Insufficient proof`,
        link: "/grow",
      },
    });

    const notif = await prisma.notification.findFirst({
      where: { userId: founderId, type: "reputation_import" },
      orderBy: { createdAt: "desc" },
    });
    assert.ok(notif);
    assert.ok(notif!.title.includes("rejected"));

    await prisma.notification.deleteMany({ where: { userId: founderId, type: "reputation_import" } });
    await prisma.reputationImport.delete({ where: { id: imp.id } });
  });
});
