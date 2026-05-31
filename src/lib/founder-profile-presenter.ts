export type PublicFounderNameInput = {
  email?: string | null;
  name?: string | null;
};

export function normalizeFounderProfileSlug(slug: string) {
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function founderProfileSlugFromEmail(email: string) {
  return normalizeFounderProfileSlug(email.split("@")[0] ?? "");
}

export function publicFounderDisplayName(founder: PublicFounderNameInput) {
  if (founder.name?.trim()) {
    return founder.name.trim();
  }

  if (founder.email) {
    return founderProfileSlugFromEmail(founder.email);
  }

  return "Founder";
}
