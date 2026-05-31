export type InviteStatusInput = {
  acceptedAt?: Date | null;
  expiresAt: Date;
  revokedAt?: Date | null;
};

export function inviteStatusLabel(invite: InviteStatusInput, now = new Date()) {
  if (invite.revokedAt) {
    return "Revoked";
  }

  if (invite.acceptedAt) {
    return "Accepted";
  }

  if (invite.expiresAt < now) {
    return "Expired";
  }

  return "Open";
}
