"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markNotificationRead(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return;
  await prisma.notification.updateMany({
    where: { id, userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return;
  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
}
