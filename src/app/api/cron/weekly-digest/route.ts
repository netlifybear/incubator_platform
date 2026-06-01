import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWeeklyDigestToCohort } from "@/lib/weekly-digest";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured on server" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cohortId = new URL(request.url).searchParams.get("cohortId");

  if (!cohortId) {
    const cohorts = await prisma.cohort.findMany({ select: { id: true } });
    const results: Array<{ cohortId: string; sent: number; total: number }> = [];

    for (const cohort of cohorts) {
      const cohortResult = await sendWeeklyDigestToCohort(cohort.id);
      results.push({ cohortId: cohort.id, sent: cohortResult.sent, total: cohortResult.total });
    }

    return NextResponse.json({ sent: true, cohorts: results });
  }

  const result = await sendWeeklyDigestToCohort(cohortId);
  return NextResponse.json({ cohortId, ...result });
}
