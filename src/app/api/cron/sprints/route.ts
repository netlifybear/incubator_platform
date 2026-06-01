import { NextResponse } from "next/server";
import { autoManageAllCohorts } from "@/lib/sprints";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await autoManageAllCohorts();
  return NextResponse.json({ managed: true, cohorts: results });
}
