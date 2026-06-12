import { prisma } from "./prisma.ts";
import { sendNotificationEmail } from "./email.ts";
import { createNotification } from "./notifications.ts";
import { recordActivity } from "./activity.ts";

export type GuestPostExchangeWithUsers = {
  id: string;
  topic: string;
  message: string | null;
  status: string;
  publishedUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  requesterId: string;
  requester: { id: string; name: string | null; email: string };
  recipientId: string;
  recipient: { id: string; name: string | null; email: string };
  cohortId: string;
};

export async function createGuestPostRequest(params: {
  requesterId: string;
  recipientId: string;
  topic: string;
  message?: string;
  cohortId: string;
}) {
  const recipient = await prisma.user.findFirst({
    where: {
      id: params.recipientId,
      cohortId: params.cohortId,
      role: "founder",
    },
    select: { id: true },
  });

  if (!recipient) {
    throw new Error("Recipient must be a founder in your cohort.");
  }

  const exchange = await prisma.guestPostExchange.create({
    data: {
      requesterId: params.requesterId,
      recipientId: params.recipientId,
      topic: params.topic,
      message: params.message ?? null,
      cohortId: params.cohortId,
    },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      recipient: { select: { id: true, name: true, email: true } },
    },
  });

  sendNotificationEmail({
    to: exchange.recipient.email,
    subject: `${exchange.requester.name ?? "A founder"} wants to write a guest post`,
    body: `<p>${exchange.requester.name ?? "A founder"} is proposing a guest post on the topic:</p><blockquote>${exchange.topic}</blockquote><p>View and respond: <a href="${process.env.NEXTAUTH_URL}/exchanges">${process.env.NEXTAUTH_URL}/exchanges</a></p>`,
  }).catch(() => {});

  createNotification({
    userId: exchange.recipient.id,
    type: "exchange_request",
    title: `${exchange.requester.name ?? "A founder"} wants to write a guest post`,
    body: `Topic: ${exchange.topic}`,
    link: "/exchanges",
  }).catch(() => {});

  return exchange;
}

export async function getSentRequests(userId: string, cohortId: string) {
  return prisma.guestPostExchange.findMany({
    where: { requesterId: userId, cohortId },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      recipient: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReceivedRequests(userId: string, cohortId: string) {
  return prisma.guestPostExchange.findMany({
    where: { recipientId: userId, cohortId },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      recipient: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateExchangeStatus(params: {
  exchangeId: string;
  userId: string;
  status: string;
  publishedUrl?: string;
}) {
  const allowedStatuses = new Set(["accepted", "declined", "published"]);

  if (!allowedStatuses.has(params.status)) {
    throw new Error("Invalid exchange status.");
  }

  if (params.status === "published") {
    if (!params.publishedUrl) {
      throw new Error("Published exchanges require a URL.");
    }

    try {
      const url = new URL(params.publishedUrl);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Published URL must start with http:// or https://.");
      }
    } catch {
      throw new Error("Published URL must be a valid http:// or https:// URL.");
    }
  }

  const exchange = await prisma.guestPostExchange.findUnique({
    where: { id: params.exchangeId },
  });

  if (!exchange) throw new Error("Exchange request not found.");
  if (exchange.recipientId !== params.userId) throw new Error("Only the recipient can update this exchange.");

  const updated = await prisma.guestPostExchange.update({
    where: { id: params.exchangeId },
    data: {
      status: params.status,
      publishedUrl: params.publishedUrl ?? exchange.publishedUrl,
    },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      recipient: { select: { id: true, name: true, email: true } },
    },
  });

  sendNotificationEmail({
    to: updated.requester.email,
    subject: `Guest post "${updated.topic}" was ${updated.status}`,
    body: `<p>Your guest post proposal "${updated.topic}" was <strong>${updated.status}</strong> by ${updated.recipient.name ?? updated.recipient.email}.</p>${updated.publishedUrl ? `<p>Published at: <a href="${updated.publishedUrl}">${updated.publishedUrl}</a></p>` : ""}<p><a href="${process.env.NEXTAUTH_URL}/exchanges">View exchange</a></p>`,
  }).catch(() => {});

  createNotification({
    userId: updated.requester.id,
    type: "exchange_response",
    title: `Guest post "${updated.topic}" was ${updated.status}`,
    body: updated.publishedUrl ? `Published at ${updated.publishedUrl}` : undefined,
    link: "/exchanges",
  }).catch(() => {});

  if (params.status === "published") {
    recordActivity({
      userId: updated.requester.id,
      cohortId: exchange.cohortId,
      type: "exchange_completed",
      metadata: { topic: updated.topic, publishedUrl: updated.publishedUrl },
    }).catch(() => {});
  }

  return updated;
}
