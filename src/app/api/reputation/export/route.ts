import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateReputationPacket, reputationPacketToJwt } from "@/lib/reputation";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const packet = await generateReputationPacket(session.user.id);
    const jwt = reputationPacketToJwt(packet);

    return NextResponse.json({
      jwt,
      packet,
      message: "Reputation packet exported. Share the JWT with another incubator instance to import your reputation.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not generate reputation packet." },
      { status: 400 },
    );
  }
}
