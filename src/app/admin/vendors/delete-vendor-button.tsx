"use client";

import { useActionState } from "react";
import { deleteVendorAction } from "../actions";

export function AdminDeleteVendorButton({ vendorId, vendorName }: { vendorId: string; vendorName: string }) {
  const [state, formAction, pending] = useActionState(deleteVendorAction, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="vendorId" value={vendorId} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`Delete ${vendorName}`}
        className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "..." : "Delete"}
      </button>
      {state.success ? <span className="ml-2 text-xs text-green-600">Deleted</span> : null}
    </form>
  );
}
