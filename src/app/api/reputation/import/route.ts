import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyReputationPacket, parseJwtToReputationPacket } from "@/lib/reputation";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { cohortId: true },
  });

  if (!currentUser?.cohortId) {
    return NextResponse.json({ error: "You must belong to a cohort to import reputation." }, { status: 400 });
  }

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

  const { valid, error } = verifyReputationPacket(packet);
  if (!valid) {
    return NextResponse.json({ error: `Signature verification failed: ${error}` }, { status: 403 });
  }

  const existing = await prisma.reputationImport.findFirst({
    where: { userId: session.user.id, sourceInstance: packet.sourceIncubator.id },
  });

  if (existing) {
    return NextResponse.json({
      message: "Reputation from this incubator was already imported.",
      packet,
      alreadyImported: true,
    });
  }

  await prisma.reputationImport.create({
    data: {
      sourceInstance: packet.sourceIncubator.id,
      sourceName: packet.sourceIncubator.name,
      founderId: packet.founderId,
      packetJson: JSON.stringify(packet),
      signature: packet.signature,
      userId: session.user.id,
    },
  });

  return NextResponse.json({
    message: `Reputation imported from ${packet.sourceIncubator.name}. Your profile now reflects ${packet.aggregates.totalPoints} points, ${packet.aggregates.totalBadges} badges, and ${packet.aggregates.totalReviews} reviews from your previous cohort.`,
    packet,
  });
}
