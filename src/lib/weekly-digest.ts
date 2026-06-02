import { prisma } from "./prisma.ts";
import { sendNotificationEmail } from "./email.ts";
import { snapshotBacklinks } from "./backlinks.ts";
import { getSprintDigestInfo } from "./sprints.ts";
import { escapeHtml, escapeHtmlAttribute } from "./html.ts";
import { getCohortActivity } from "./activity.ts";

type FounderDigest = {
  id: string;
  email: string;
  name: string | null;
  profileViewCount: number;
  publicProfileEnabled: boolean;
  reviewCount: number;
  helpfulVoteCount: number;
  backlinkVerifiedCount: number;
  backlinkLostCount: number;
  incomingTargetedRequests: number;
  profileSlug: string | null;
  sprintHtml: string;
  activityHtml: string;
};

export async function generateDigestForFounder(userId: string): Promise<FounderDigest | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      profileViewCount: true,
      publicProfileEnabled: true,
      profileSlug: true,
      cohortId: true,
    },
  });

  if (!user || !user.email) return null;

  const [reviewCount, backlinkVerifiedCount, backlinkLostCount, incomingTargetedRequests, sprintInfo, activityEvents, helpfulVoteCount] =
    await Promise.all([
      prisma.review.count({ where: { userId } }),
      prisma.backlinkLog.count({ where: { userId, status: "verified" } }),
      prisma.backlinkLog.count({ where: { userId, status: "lost" } }),
      prisma.vendorRequest.count({
        where: { targetUserId: userId, status: "open" },
      }),
      user.cohortId ? getSprintDigestInfo(user.cohortId, userId) : null,
      user.cohortId
        ? getCohortActivity(user.cohortId, 10).then((events) =>
            events.filter((e) => e.userId !== userId),
          )
        : [],
      prisma.helpfulVote.count({
        where: {
          review: { userId },
          value: true,
        },
      }),
    ]);

  let sprintHtml = "";
  if (sprintInfo?.activeName) {
    const sprintsUrl = escapeHtmlAttribute(`${process.env.NEXTAUTH_URL ?? ""}/sprints`);
    sprintHtml = `<p style="font-size:14px;padding:8px 16px;background:#f0fdf4;border-radius:8px"><strong>Active sprint:</strong> ${escapeHtml(sprintInfo.activeName)} — ${sprintInfo.activeMyReviews} / ${sprintInfo.activeGoal} reviews <a href="${sprintsUrl}" style="color:#2563eb">View sprint</a></p>`;
  } else if (sprintInfo?.recentName && sprintInfo.recentTotalReviews > 0) {
    sprintHtml = `<p style="font-size:14px;padding:8px 16px;background:#f5f5f5;border-radius:8px"><strong>${escapeHtml(sprintInfo.recentName)}</strong> — ${sprintInfo.recentTotalReviews} reviews by ${sprintInfo.recentParticipants} founder${sprintInfo.recentParticipants === 1 ? "" : "s"}</p>`;
  }

  let activityHtml = "";
  if (activityEvents.length > 0) {
    const items = activityEvents.map((e) => {
      const name = escapeHtml(e.user.name ?? "A founder");
      switch (e.type) {
        case "review_written": {
          const meta = e.metadata as Record<string, string> | null;
          const vendor = meta?.vendorName ? escapeHtml(meta.vendorName) : "a vendor";
          return `<li style="margin-bottom:6px">${name} reviewed ${vendor}</li>`;
        }
        case "badge_earned":
        case "tag_earned": {
          return `<li style="margin-bottom:6px">${name} earned a contribution tag</li>`;
        }
        case "exchange_completed": {
          return `<li style="margin-bottom:6px">${name} completed a guest post exchange</li>`;
        }
        case "request_answered": {
          return `<li style="margin-bottom:6px">${name} answered a question</li>`;
        }
        case "helpful_vote_received": {
          return `<li style="margin-bottom:6px">${name}'s review was marked helpful</li>`;
        }
        default:
          return "";
      }
    }).filter(Boolean).join("");
    activityHtml = `<div style="margin-bottom:24px"><h2 style="font-size:16px;margin:0 0 8px">Cohort activity</h2><ul style="font-size:14px;line-height:1.6;color:#333;padding-left:20px;margin:0">${items}</ul></div>`;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profileViewCount: user.profileViewCount,
    publicProfileEnabled: user.publicProfileEnabled,
    profileSlug: user.profileSlug,
    reviewCount,
    helpfulVoteCount,
    backlinkVerifiedCount,
    backlinkLostCount,
    incomingTargetedRequests,
    sprintHtml,
    activityHtml,
  };
}

function digestHtml(digest: FounderDigest): string {
  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const name = escapeHtml(digest.name ?? "Founder");
  const profileUrl = `${baseUrl}/founder/${digest.profileSlug ?? ""}`;
  const safeProfileUrl = escapeHtmlAttribute(profileUrl);
  const settingsUrl = escapeHtmlAttribute(`${baseUrl}/profile/settings`);
  const vendorsUrl = escapeHtmlAttribute(`${baseUrl}/`);
  const backlinksUrl = escapeHtmlAttribute(`${baseUrl}/backlinks`);
  const requestsUrl = escapeHtmlAttribute(`${baseUrl}/requests`);

  let actionsHtml = "";

  if (!digest.publicProfileEnabled) {
    actionsHtml += `<li><a href="${settingsUrl}">Enable your public profile</a> — get discovered by peers and search engines</li>`;
  }
  if (digest.reviewCount === 0) {
    actionsHtml += `<li><a href="${vendorsUrl}">Write your first review</a> — share vendor experience with your cohort</li>`;
  }
  if (digest.backlinkVerifiedCount === 0) {
    actionsHtml += `<li><a href="${backlinksUrl}">Add a backlink</a> — connect your startup's URL to build portable reputation</li>`;
  }
  if (digest.incomingTargetedRequests > 0) {
    actionsHtml += `<li><a href="${requestsUrl}">Answer ${digest.incomingTargetedRequests} founder question(s)</a> — help peers evaluating vendors</li>`;
  }

  return `
    <div style="max-width:560px;margin:0 auto;font-family:system-ui,sans-serif;padding:24px">
      <h1 style="font-size:20px;margin:0 0 8px">Your weekly digest, ${name}</h1>
      <p style="color:#666;margin:0 0 24px">Incubator Trust Platform</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr>
          <td style="padding:12px;background:#f5f5f5;border-radius:8px;text-align:center;width:25%">
            <div style="font-size:24px;font-weight:700">${digest.profileViewCount}</div>
            <div style="font-size:12px;color:#666">Profile views</div>
          </td>
          <td style="padding:12px;text-align:center;width:25%">
            <div style="font-size:24px;font-weight:700">${digest.reviewCount}</div>
            <div style="font-size:12px;color:#666">Reviews</div>
          </td>
          <td style="padding:12px;background:#f5f5f5;border-radius:8px;text-align:center;width:25%">
            <div style="font-size:24px;font-weight:700">${digest.helpfulVoteCount}</div>
            <div style="font-size:12px;color:#666">Founders helped</div>
          </td>
          <td style="padding:12px;text-align:center;width:25%">
            <div style="font-size:24px;font-weight:700">${digest.backlinkVerifiedCount}</div>
            <div style="font-size:12px;color:#666">Backlinks</div>
          </td>
        </tr>
      </table>

      ${digest.helpfulVoteCount > 0 ? `<p style="padding:10px 16px;background:#f0fdf4;border-radius:8px;font-size:14px">Your reviews helped <strong>${digest.helpfulVoteCount}</strong> founder${digest.helpfulVoteCount === 1 ? "" : "s"} make better vendor decisions this week.</p>` : ""}

      ${digest.incomingTargetedRequests > 0 ? `<p style="padding:8px 16px;background:#fef3c7;border-radius:8px;font-size:14px"><strong>${digest.incomingTargetedRequests} founder(s)</strong> asked you for vendor details. <a href="${requestsUrl}" style="color:#2563eb;text-decoration:underline">View questions</a></p>` : ""}

      ${digest.sprintHtml}

      ${digest.activityHtml}

      <p style="font-size:14px;color:#666">Your profile: <a href="${safeProfileUrl}" style="color:#2563eb">${escapeHtml(profileUrl)}</a></p>

      ${actionsHtml ? `<h2 style="font-size:16px;margin:24px 0 8px">Suggested next steps</h2><ul style="font-size:14px;line-height:1.8;color:#333;padding-left:20px">${actionsHtml}</ul>` : ""}

      <p style="font-size:12px;color:#999;margin-top:32px;border-top:1px solid #eee;padding-top:16px">
        You receive this because you are a cohort member of the Incubator Trust Platform.
      </p>
    </div>
  `.trim();
}

export async function sendWeeklyDigestToFounder(userId: string): Promise<{ sent: boolean; email?: string }> {
  const digest = await generateDigestForFounder(userId);
  if (!digest) return { sent: false };

  await snapshotBacklinks(userId);

  await sendNotificationEmail({
    to: digest.email,
    subject: `Your weekly impact — ${digest.helpfulVoteCount} founder${digest.helpfulVoteCount === 1 ? "" : "s"} helped this week`,
    body: digestHtml(digest),
  });

  return { sent: true, email: digest.email };
}

export async function sendWeeklyDigestToCohort(cohortId: string): Promise<{ sent: number; total: number }> {
  const founders = await prisma.user.findMany({
    where: { cohortId, role: "founder" },
    select: { id: true, email: true },
  });

  let sent = 0;
  for (const founder of founders) {
    if (!founder.email) continue;
    const result = await sendWeeklyDigestToFounder(founder.id);
    if (result.sent) sent++;
  }

  return { sent, total: founders.length };
}
