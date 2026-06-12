import { prisma } from "./prisma.ts";
import { sendNotificationEmail } from "./email.ts";
import { escapeHtml, escapeHtmlAttribute } from "./html.ts";
import { createNotification } from "./notifications.ts";
import type { Prisma } from "@prisma/client";
import {
  normalizeVendorRequestEdit,
  normalizeVendorRequestCategory,
  normalizeVendorRequestDescription,
} from "./vendor-request-validation.ts";

export type CreateTargetedRequestInput = {
  cohortId: string;
  userId: string;
  targetUserId: string;
  category: string;
  description: string;
  message: string;
};

export async function createTargetedVendorRequest(input: CreateTargetedRequestInput) {
  const category = normalizeVendorRequestCategory(input.category);
  const description = normalizeVendorRequestDescription(input.description);
  const message = input.message.trim();

  if (message.length < 2) {
    throw new Error("Message must be at least 2 characters.");
  }

  const request = await prisma.vendorRequest.create({
    data: {
      cohortId: input.cohortId,
      userId: input.userId,
      targetUserId: input.targetUserId,
      category,
      description,
      message,
      status: "open",
    },
  });

  const [requester, targetUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.userId }, select: { name: true, email: true } }),
    prisma.user.findUnique({ where: { id: input.targetUserId }, select: { email: true, name: true } }),
  ]);

  if (targetUser?.email && requester?.name) {
    const safeRequesterName = escapeHtml(requester.name);
    const safeDescription = escapeHtml(description);
    const safeMessage = escapeHtml(message);
    const requestsUrl = escapeHtmlAttribute(`${process.env.NEXTAUTH_URL ?? ""}/requests`);

    sendNotificationEmail({
      to: targetUser.email,
      subject: `${requester.name} needs your vendor expertise — Incubator Trust`,
      body: `<p><strong>${safeRequesterName}</strong> needs your help evaluating a vendor. Your firsthand review can help them make a better decision.</p><p>${safeMessage}</p><p><a href="${requestsUrl}">Respond on your requests page</a></p><p style="color:#666;font-size:12px">Request: ${safeDescription}</p>`,
    }).catch(() => {});

    createNotification({
      userId: input.targetUserId,
      type: "targeted_request",
      title: `${requester.name} asked about ${description}`,
      body: safeMessage,
      link: "/requests",
    }).catch(() => {});
  }

  return request;
}

const incomingTargetedInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.VendorRequestInclude;

export type IncomingTargetedRequest = Prisma.VendorRequestGetPayload<{
  include: typeof incomingTargetedInclude;
}>;

export async function listIncomingTargetedRequests(userId: string): Promise<IncomingTargetedRequest[]> {
  return prisma.vendorRequest.findMany({
    where: {
      targetUserId: userId,
      status: "open",
    },
    include: incomingTargetedInclude,
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });
}

export type CreateVendorRequestInput = {
  cohortId: string;
  userId: string;
  category: string;
  description: string;
};

export async function listOpenVendorRequestsForCohort(cohortId: string) {
  return prisma.vendorRequest.findMany({
    where: {
      cohortId,
      status: "open",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 8,
  });
}

export async function listAdminVendorRequestsForCohort(cohortId: string) {
  return prisma.vendorRequest.findMany({
    where: {
      cohortId,
      status: "open",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function listFulfilledVendorRequestsForCohort(cohortId: string) {
  return prisma.vendorRequest.findMany({
    where: {
      cohortId,
      status: "fulfilled",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      fulfilledVendor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      fulfilledAt: "desc",
    },
    take: 12,
  });
}

export async function listClosedVendorRequestsForCohort(cohortId: string) {
  return prisma.vendorRequest.findMany({
    where: {
      cohortId,
      status: "closed",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 12,
  });
}

export async function listFounderVendorRequests(userId: string, cohortId: string) {
  return prisma.vendorRequest.findMany({
    where: {
      userId,
      cohortId,
    },
    include: {
      fulfilledVendor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      {
        status: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function createVendorRequestForCohort(input: CreateVendorRequestInput) {
  const category = normalizeVendorRequestCategory(input.category);
  const description = normalizeVendorRequestDescription(input.description);

  return prisma.vendorRequest.create({
    data: {
      cohortId: input.cohortId,
      userId: input.userId,
      category,
      description,
      status: "open",
    },
  });
}

export type UpdateVendorRequestInput = {
  requestId: string;
  cohortId: string;
  category: string;
  description: string;
};

export async function updateOpenVendorRequestForCohort(input: UpdateVendorRequestInput) {
  const request = await prisma.vendorRequest.findFirst({
    where: {
      id: input.requestId,
      cohortId: input.cohortId,
      status: "open",
    },
    select: {
      id: true,
    },
  });

  if (!request) {
    throw new Error("Open request not found for this cohort.");
  }

  const update = normalizeVendorRequestEdit({
    category: input.category,
    description: input.description,
  });

  return prisma.vendorRequest.update({
    where: { id: request.id },
    data: update,
  });
}

export type CloseVendorRequestInput = {
  requestId: string;
  cohortId: string;
  adminNote?: string;
};

export async function closeVendorRequestForCohort(input: CloseVendorRequestInput) {
  const adminNote = input.adminNote?.trim() || null;

  const request = await prisma.vendorRequest.findFirst({
    where: {
      id: input.requestId,
      cohortId: input.cohortId,
      status: "open",
    },
    select: {
      id: true,
    },
  });

  if (!request) {
    throw new Error("Open request not found for this cohort.");
  }

  return prisma.vendorRequest.update({
    where: { id: request.id },
    data: {
      status: "closed",
      adminNote,
    },
  });
}

export type FulfillVendorRequestInput = {
  requestId: string;
  cohortId: string;
  vendorName: string;
  vendorContact?: string;
};

export async function fulfillVendorRequestWithVendor(input: FulfillVendorRequestInput) {
  const request = await prisma.vendorRequest.findFirst({
    where: {
      id: input.requestId,
      cohortId: input.cohortId,
      status: "open",
    },
    select: {
      id: true,
      category: true,
    },
  });

  if (!request) {
    throw new Error("Open request not found for this cohort.");
  }

  const vendorName = input.vendorName.trim();

  if (vendorName.length < 2) {
    throw new Error("Vendor name must be at least 2 characters.");
  }

  const vendorContact = input.vendorContact?.trim() || null;

  return prisma.$transaction(async (tx) => {
    const vendor = await tx.vendor.create({
      data: {
        name: vendorName,
        category: request.category,
        contact: vendorContact,
        cohortId: input.cohortId,
      },
    });

    const fulfilledRequest = await tx.vendorRequest.update({
      where: { id: request.id },
      data: {
        status: "fulfilled",
        fulfilledAt: new Date(),
        fulfilledVendorId: vendor.id,
      },
    });

    return { vendor, fulfilledRequest };
  });
}
