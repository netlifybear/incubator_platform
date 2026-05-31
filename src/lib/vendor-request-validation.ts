export function normalizeVendorRequestCategory(category: string) {
  const normalizedCategory = category.trim();

  if (!normalizedCategory) {
    throw new Error("Vendor request category is required.");
  }

  return normalizedCategory;
}

export function normalizeVendorRequestDescription(description: string) {
  const normalizedDescription = description.trim();

  if (normalizedDescription.length < 15) {
    throw new Error("Vendor request description must be at least 15 characters.");
  }

  return normalizedDescription;
}

export type VendorRequestEditInput = {
  category: string;
  description: string;
};

export function normalizeVendorRequestEdit(input: VendorRequestEditInput) {
  return {
    category: normalizeVendorRequestCategory(input.category),
    description: normalizeVendorRequestDescription(input.description),
  };
}
