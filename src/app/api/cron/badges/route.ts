import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeAndAwardBadges } from "@/lib/badges";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { role: "founder" },
    select: { id: true, email: true },
  });

  const results: Array<{ email: string; awarded: string[]; error?: string }> = [];

  for (const user of users) {
    try {
      const awarded = await computeAndAwardBadges(user.id);
      results.push({ email: user.email, awarded });
    } catch (error) {
      results.push({ email: user.email, awarded: [], error: String(error) });
    }
  }

  const totalAwarded = results.reduce((sum, r) => sum + r.awarded.length, 0);
  const errors = results.filter((r) => r.error).length;

  return NextResponse.json({
    processed: users.length,
    totalAwarded,
    errors,
    results,
  });
}
