import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateReputationJWT } from "@/lib/export-reputation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const jwt = await generateReputationJWT(session.user.id);
    const filename = `reputation-${session.user.id.slice(0, 8)}.jwt`;

    return new Response(jwt, {
      status: 200,
      headers: {
        "Content-Type": "application/jwt",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return new Response(
      err instanceof Error ? err.message : "Internal error",
      { status: 500 },
    );
  }
}
