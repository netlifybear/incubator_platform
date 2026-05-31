type CohortUser = {
  role?: string | null;
  cohortId?: string | null;
};

export function isAdminRole(role?: string | null) {
  return role === "admin";
}

export function canManageCohort(user: CohortUser | null, cohortId: string) {
  return Boolean(isAdminRole(user?.role) && user?.cohortId === cohortId);
}
