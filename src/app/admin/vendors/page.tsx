import { prisma } from "@/lib/prisma";
import { AdminCreateVendorForm } from "./create-vendor-form";
import { AdminDeleteVendorButton } from "./delete-vendor-button";

export default async function AdminVendorsPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: { _count: { select: { reviews: true, consumerReviews: true } } },
  });

  const categories = [...new Set(vendors.map((v) => v.category))].sort();

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Vendors
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Vendor directory
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          {vendors.length} vendors across {categories.length} categories.
        </p>
      </section>

      <details className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--accent)]">
          Add vendor
        </summary>
        <div className="mt-4">
          <AdminCreateVendorForm categories={categories} />
        </div>
      </details>

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <h2 className="text-xl font-semibold">All vendors</h2>
        {categories.map((category) => {
          const catVendors = vendors.filter((v) => v.category === category);
          return (
            <div key={category} className="mt-6">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                {category}
              </p>
              <div className="mt-3 space-y-2">
                {catVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{vendor.name}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {vendor.contact ?? "No contact"}
                        {vendor._count.reviews > 0 || vendor._count.consumerReviews > 0
                          ? ` · ${vendor._count.reviews} founder review${vendor._count.reviews === 1 ? "" : "s"}${vendor._count.consumerReviews > 0 ? `, ${vendor._count.consumerReviews} consumer` : ""}`
                          : ""}
                      </p>
                    </div>
                    <AdminDeleteVendorButton vendorId={vendor.id} vendorName={vendor.name} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {vendors.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">No vendors yet.</p>
        ) : null}
      </section>
    </div>
  );
}
