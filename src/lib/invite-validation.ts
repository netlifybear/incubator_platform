const inviteDurationMs = 7 * 24 * 60 * 60 * 1000;

export function normalizeInviteEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Invite email must be a valid email address.");
  }

  return normalizedEmail;
}

export function getInviteExpirationDate(createdAt = new Date()) {
  return new Date(createdAt.getTime() + inviteDurationMs);
}
