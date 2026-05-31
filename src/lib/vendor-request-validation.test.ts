import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeVendorRequestEdit,
  normalizeVendorRequestCategory,
  normalizeVendorRequestDescription,
} from "./vendor-request-validation.ts";

test("request category is trimmed and required", () => {
  assert.equal(normalizeVendorRequestCategory("  Legal  "), "Legal");
  assert.throws(() => normalizeVendorRequestCategory("  "), /category is required/);
});

test("request description is trimmed and must be specific", () => {
  assert.equal(
    normalizeVendorRequestDescription("  Need help with Delaware incorporation docs.  "),
    "Need help with Delaware incorporation docs.",
  );
  assert.throws(
    () => normalizeVendorRequestDescription("too short"),
    /at least 15 characters/,
  );
});

test("request edits normalize category and description together", () => {
  assert.deepEqual(
    normalizeVendorRequestEdit({
      category: "  Insurance  ",
      description: "  Need D&O insurance broker recommendations.  ",
    }),
    {
      category: "Insurance",
      description: "Need D&O insurance broker recommendations.",
    },
  );

  assert.throws(
    () => normalizeVendorRequestEdit({ category: "", description: "short" }),
    /category is required/,
  );
});
