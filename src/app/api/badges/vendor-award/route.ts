import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { clientIpFromHeaders } from "@/lib/badge-award-attempts";
import { handleExternalBadgeAward } from "@/lib/badge-award-flow";

export async function POST(request: NextRequest) {
  try {
    const result = await handleExternalBadgeAward({
      body: await request.json(),
      ipAddress: clientIpFromHeaders(request.headers),
      issuerType: "vendor",
    });

    if (result.status === 200) {
      revalidatePath("/");
      revalidatePath("/admin/requests");
    }

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not award badge.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
