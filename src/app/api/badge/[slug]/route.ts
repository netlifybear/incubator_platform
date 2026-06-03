import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeFounderProfileSlug, founderProfileSlugFromEmail } from "@/lib/founder-profile-presenter";

type BadgeRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: BadgeRouteProps) {
  const { slug } = await params;
  const normalizedSlug = normalizeFounderProfileSlug(slug);

  if (!normalizedSlug) {
    return new NextResponse("Invalid slug", { status: 404 });
  }

  const founder = await prisma.user.findFirst({
    where: {
      role: "founder",
      cohortId: { not: null },
      profileSlug: normalizedSlug,
      publicProfileEnabled: true,
    },
    select: {
      id: true,
      name: true,
      cohort: { select: { name: true } },
      profileCompletePercentage: true,
    },
  });

  if (!founder) {
    const legacyUsers = await prisma.user.findMany({
      where: {
        role: "founder",
        cohortId: { not: null },
        profileSlug: null,
        publicProfileEnabled: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        cohort: { select: { name: true } },
        profileCompletePercentage: true,
      },
    });

    const legacy = legacyUsers.find(
      (u) => founderProfileSlugFromEmail(u.email) === normalizedSlug,
    );

    if (!legacy) {
      return new NextResponse("Founder not found", { status: 404 });
    }

    const svg = generateBadgeSvg(legacy.name ?? "Founder", legacy.cohort?.name ?? "Cohort", legacy.profileCompletePercentage);

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  }

  const svg = generateBadgeSvg(founder.name ?? "Founder", founder.cohort?.name ?? "Cohort", founder.profileCompletePercentage);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function generateBadgeSvg(
  name: string,
  cohort: string,
  profilePct: number,
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#16213e"/>
    </linearGradient>
  </defs>
  <rect width="240" height="80" rx="12" fill="url(#bg)"/>
  <text x="16" y="28" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#e0e0e0">${escapeXml(name)}</text>
  <text x="16" y="46" font-family="system-ui, sans-serif" font-size="10" fill="#888">Verified in ${escapeXml(cohort)}</text>
  <rect x="16" y="54" width="140" height="6" rx="3" fill="#333"/>
  <rect x="16" y="54" width="${Math.round(profilePct * 1.4)}" height="6" rx="3" fill="#4ade80"/>
  <text x="16" y="72" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#4ade80">${profilePct}% profile complete</text>
  <text x="180" y="72" font-family="system-ui, sans-serif" font-size="9" fill="#666">incubator-trust</text>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
