import { NextResponse } from "next/server";
import { getCurrentFounder } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/gsc`;

function getGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.AUTH_GOOGLE_ID!,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: `openid email profile ${GSC_SCOPE}`,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

async function exchangeCode(code: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.AUTH_GOOGLE_ID!,
      client_secret: process.env.AUTH_GOOGLE_SECRET!,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    scope: string;
  }>;
}

async function getGscEmail(accessToken: string): Promise<string> {
  const res = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return "";
  const data = await res.json() as { email?: string };
  return data.email ?? "";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // Callback: Google redirected back with auth code
  if (code && state) {
    const stored = await prisma.gscState.findUnique({ where: { state } });
    if (!stored) {
      return NextResponse.redirect(
        new URL("/backlinks?gsc=error", process.env.NEXTAUTH_URL),
      );
    }

    await prisma.gscState.delete({ where: { id: stored.id } });

    try {
      const tokens = await exchangeCode(code);
      const gscEmail = await getGscEmail(tokens.access_token);

      await prisma.user.update({
        where: { id: stored.userId },
        data: {
          gscAccessToken: tokens.access_token,
          gscRefreshToken: tokens.refresh_token ?? null,
          gscEmail: gscEmail || null,
        },
      });

      return NextResponse.redirect(
        new URL("/backlinks?gsc=connected", process.env.NEXTAUTH_URL),
      );
    } catch {
      return NextResponse.redirect(
        new URL("/backlinks?gsc=error", process.env.NEXTAUTH_URL),
      );
    }
  }

  // Init: start OAuth flow
  const founder = await getCurrentFounder();
  if (!founder) {
    return NextResponse.redirect(
      new URL("/signin", process.env.NEXTAUTH_URL),
    );
  }

  if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) {
    return NextResponse.redirect(
      new URL("/backlinks?gsc=noconfig", process.env.NEXTAUTH_URL),
    );
  }

  const stateRaw = crypto.randomUUID();
  await prisma.gscState.create({
    data: { state: stateRaw, userId: founder.id },
  });

  return NextResponse.redirect(getGoogleAuthUrl(stateRaw));
}

export const runtime = "nodejs";
