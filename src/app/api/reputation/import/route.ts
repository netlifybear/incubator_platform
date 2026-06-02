import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyReputationPacket, parseJwtToReputationPacket } from "@/lib/reputation";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, cohortId: true },
  });

  if (!currentUser?.cohortId) {
    return NextResponse.json({ error: "You must belong to a cohort to import reputation." }, { status: 400 });
  }

  const cohort = await prisma.cohort.findUnique({
    where: { id: currentUser.cohortId },
    select: { defaultTrustPolicy: true },
  });

  let jwt: string;
  try {
    const body = await request.json();
    jwt = body.jwt;
  } catch {
    return NextResponse.json({ error: "Request body must include 'jwt' field." }, { status: 400 });
  }

  const packet = parseJwtToReputationPacket(jwt);
  if (!packet) {
    return NextResponse.json({ error: "Invalid JWT format." }, { status: 400 });
  }

  const { valid, error } = await verifyReputationPacket(packet);
  if (!valid) {
    return NextResponse.json({ error: `Signature verification failed: ${error}` }, { status: 403 });
  }

  const existing = await prisma.reputationImport.findFirst({
    where: { userId: currentUser.id, sourceInstance: packet.sourceIncubator.id },
  });

  if (existing && existing.status === "approved") {
    return NextResponse.json({
      message: "Reputation from this incubator was already imported and approved.",
      alreadyImported: true,
    });
  }

  if (existing && existing.status === "pending") {
    return NextResponse.json({
      message: "You already have a pending import request from this incubator. Awaiting admin approval.",
      status: "pending",
    });
  }

  await prisma.reputationImport.create({
    data: {
      sourceInstance: packet.sourceIncubator.id,
      sourceName: packet.sourceIncubator.name,
      founderId: packet.founderId,
      packetJson: JSON.stringify(packet),
      signature: packet.signature,
      userId: currentUser.id,
      status: "pending",
      trustPolicy: cohort?.defaultTrustPolicy ?? "all",
    },
  });

  const admins = await prisma.user.findMany({
    where: { cohortId: currentUser.cohortId, role: "admin" },
    select: { id: true },
  });

  for (const admin of admins) {
    createNotification({
      userId: admin.id,
      type: "reputation_import",
      title: "Pending reputation import",
      body: `A founder submitted a reputation import from ${packet.sourceIncubator.name} for your approval.`,
      link: "/admin/imports",
    }).catch(() => {});
  }

  return NextResponse.json({
    message: `Reputation import submitted from ${packet.sourceIncubator.name}. An admin will review and approve it.`,
    status: "pending",
  });
}
