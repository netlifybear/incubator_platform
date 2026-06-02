import { NextResponse } from "next/server";

export async function GET() {
  const publicKeyPem = process.env.REPUTATION_PUBLIC_KEY;

  if (!publicKeyPem) {
    return NextResponse.json(
      { error: "Asymmetric key pair not configured. This instance uses shared-secret mode." },
      { status: 404 },
    );
  }

  if (!publicKeyPem.includes("BEGIN PUBLIC KEY")) {
    return NextResponse.json({ error: "Invalid public key configuration" }, { status: 500 });
  }

  return new NextResponse(publicKeyPem, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
