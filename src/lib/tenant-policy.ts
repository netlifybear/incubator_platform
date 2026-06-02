type CohortScopedUser = {
  cohortId?: string | null;
  role?: string | null;
};

type DisplayableFounder = {
  name?: string | null;
  email?: string | null;
};

export function hasActiveCohort(
  user: CohortScopedUser | null,
): user is CohortScopedUser & { cohortId: string } {
  return Boolean(user?.cohortId);
}

export function canAccessCohortResource(
  user: CohortScopedUser | null,
  resourceCohortId: string,
) {
  return Boolean(user?.cohortId && user.cohortId === resourceCohortId);
}

export function isAlumni(user: CohortScopedUser | null): boolean {
  return user?.role === "alumni";
}

export function canWriteToCohort(user: CohortScopedUser | null): boolean {
  if (!user?.cohortId) return false;
  return user.role === "founder" || user.role === "admin";
}

export function getFounderDisplayName(founder: DisplayableFounder) {
  return founder.name ?? founder.email ?? "Unknown founder";
}
