"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { acceptInviteByToken } from "@/lib/invites";

export async function acceptInviteAction(token: string) {
  const session = await getServerSession(authOptions);
  await acceptInviteByToken(token);
  if (session?.user) {
    redirect("/");
  }
  redirect("/signin?callbackUrl=/");
}
