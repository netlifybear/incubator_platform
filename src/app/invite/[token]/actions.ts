"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { acceptInviteByToken, getInviteByToken } from "@/lib/invites";

export async function acceptInviteAction(token: string) {
  const session = await getServerSession(authOptions);
  const invite = await getInviteByToken(token);

  if (!session?.user?.email) {
    redirect(`/signin?callbackUrl=/invite/${token}`);
  }

  if (!invite || session.user.email !== invite.email) {
    throw new Error("You must be signed in with the invited email address to accept this invite.");
  }

  await acceptInviteByToken(token);
  redirect("/");
}
