/*
Alumni participation policy:

- Alumni keep full read access: cohort pages, vendor directory, founder profiles.
- Alumni keep personal data management: profile edits, backlinks, GSC, helpful votes.
- Alumni CAN vote on review helpfulness. This is low risk (public data, no leakage) and
  encourages continued engagement with reviews they have experience with.
- All other write actions are blocked by canWriteToCohort: reviews, vendor requests,
  exchanges, nominations, and invites. These modify cohort-scoped data and require
  active founder or admin role.

Rationale: Alumni have institutional knowledge but no active stake. Helpful votes
surface good content without leaking private data or modifying cohort state.
*/

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

export function canVoteOnReview(user: CohortScopedUser | null): boolean {
  if (!user?.cohortId) return false;
  return user.role === "founder" || user.role === "admin" || user.role === "alumni";
}

export function getFounderDisplayName(founder: DisplayableFounder) {
  return founder.name ?? founder.email ?? "Unknown founder";
}
