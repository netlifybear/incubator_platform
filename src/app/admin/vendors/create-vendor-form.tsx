"use client";

import { useActionState } from "react";
import { createVendorAction } from "../actions";

export function AdminCreateVendorForm({ categories }: { categories: string[] }) {
  const [state, formAction, pending] = useActionState(createVendorAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold" htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            required
            className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            placeholder="e.g., Northstar Startup Counsel"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="category">Category</label>
          <input
            id="category"
            name="category"
            required
            list="categories"
            className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            placeholder="e.g., Legal"
          />
          <datalist id="categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold" htmlFor="contact">Contact / URL</label>
        <input
          id="contact"
          name="contact"
          className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          placeholder="e.g., hello@northstar.co or https://northstar.co"
        />
      </div>
      {state.error ? <p className="text-sm font-medium text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-green-700">{state.success}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add vendor"}
      </button>
    </form>
  );
}
