"use server";

import { redirect } from "next/navigation";
import { acceptInviteByToken } from "@/lib/invites";

export async function acceptInviteAction(token: string) {
  await acceptInviteByToken(token);
  redirect("/signin?callbackUrl=/");
}
