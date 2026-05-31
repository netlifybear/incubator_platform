"use client";

import { useState, useCallback } from "react";

type CopyInviteLinkProps = {
  token: string;
};

export function CopyInviteLink({ token }: CopyInviteLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const url = `${window.location.origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available — select the text manually
    }
  }, [token]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--accent-strong)] transition hover:bg-white"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
