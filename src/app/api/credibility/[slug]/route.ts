import { NextResponse } from "next/server";
import { getPublicFounderProfile } from "@/lib/founder-profiles";
import { getFounderBadges } from "@/lib/badges";
import { getFounderPoints, getFounderCohortRank } from "@/lib/points";
import { reviewContributionPoints } from "@/lib/review-quality";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";

const SHARED_SECRET = process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production";

function createSignature(payload: string): string {
  return crypto.createHmac("sha256", SHARED_SECRET).update(payload).digest("base64url");
}

type CredibilityRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  _request: Request,
  { params }: CredibilityRouteProps,
) {
  const { slug } = await params;
  
  try {
    const founder = await getPublicFounderProfile(slug);
    
    if (!founder) {
      return NextResponse.json(
        { error: "Founder not found" },
        { status: 404 }
      );
    }

    // Only return data if founder has public profile enabled (consistent with profile page)
    if (!founder.publicProfileEnabled) {
      return NextResponse.json(
        { error: "Profile not public" },
        { status: 404 }
      );
    }

    // Generate the reputation packet (same as used in the credibility page)
    const [points, badges, rank, reviewStats] = await Promise.all([
      getFounderPoints(founder.id),
      getFounderBadges(founder.email),
      founder.cohort?.id ? getFounderCohortRank(founder.id, founder.cohort.id) : Promise.resolve(null),
      prisma.review.aggregate({
        where: { userId: founder.id },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    // Calculate used vendor percentage
    const founderReviews = await prisma.review.findMany({
      where: { userId: founder.id },
      select: { id: true, usedVendor: true },
    });
    const usedVendorCount = founderReviews.filter(r => r.usedVendor).length;
    const usedVendorPercentage = founderReviews.length > 0 
      ? Math.round((usedVendorCount / founderReviews.length) * 100) 
      : 0;

    // Calculate helpful vote ratio
    const helpfulVotes = await prisma.helpfulVote.findMany({
      where: {
        reviewId: { in: founderReviews.map(r => r.id) }
      },
      select: { value: true }
    });
    const helpfulVoteRatio = helpfulVotes.length > 0
      ? Math.round((helpfulVotes.filter(v => v.value).length / helpfulVotes.length) * 100)
      : 0;

    // Calculate quality score trend (simplified as average quality %)
    const qualityScores = await prisma.review.findMany({
      where: { userId: founder.id },
      select: { comment: true }
    });
    const qualityScorePercentage = qualityScores.length > 0
      ? Math.round(
          (qualityScores.reduce((sum, r) => sum + (reviewContributionPoints(r.comment) / 20 * 100), 0) / qualityScores.length)
        )
      : 0;

    // Create badge verification hash (HMAC of badge data)
    const badgeData = badges.map(b => ({
      type: b.type,
      label: b.label,
    }));
    const badgePayload = JSON.stringify({ founderId: founder.id, badges: badgeData });
    const badgeVerificationHash = crypto.createHmac("sha256", SHARED_SECRET)
      .update(badgePayload)
      .digest("hex");

    // Build the credibility report data
    const credibilityData = {
      version: "1.0",
      founderId: founder.id,
      sourceIncubator: {
        id: founder.cohort?.id ?? "",
        name: founder.cohort?.name ?? "",
        verificationMethod: "email_verified + cohort_invite",
      },
      attestations: [
        {
          type: "verified_status",
          value: true,
          label: "Verified cohort member",
          issuedAt: new Date().toISOString(),
        },
        ...badges.map(b => ({
          type: `badge_${b.type}`,
          value: b.label,
          label: b.label,
          icon: b.icon,
          issuedAt: new Date().toISOString(),
        })),
        ...(rank ? [{
          type: "cohort_rank",
          value: `#${rank.rank} of ${rank.total}`,
          label: `Ranked #${rank.rank} in cohort`,
          issuedAt: new Date().toISOString(),
        }] : []),
      ],
      aggregates: {
        avgVendorRating: reviewStats._avg.rating ?? null,
        totalReviews: reviewStats._count ?? 0,
        totalBadges: badges.length,
        totalPoints: points.total,
      },
      issuedAt: new Date().toISOString(),
      // Additional credibility-specific fields
      credibilityMetrics: {
        usedVendorPercentage,
        helpfulVoteRatio,
        qualityScorePercentage,
        badgeVerificationHash,
        gscConnected: Boolean(founder.gscEmail),
      }
    };

    // Create signature for the payload (excluding the signature field itself)
    const payloadForSignature = JSON.stringify({
      ...credibilityData,
      signature: "" // Temporarily remove signature for signing
    });
    const signature = createSignature(payloadForSignature);
    
    // Return the signed credibility report
    const signedCredibilityReport = {
      ...credibilityData,
      signature
    };

    return NextResponse.json(signedCredibilityReport, {
      headers: {
        "Content-Type": "application/json",
        // Cache for 5 minutes since this is somewhat static data
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600"
      }
    });
  } catch (error) {
    console.error("Error generating credibility report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
