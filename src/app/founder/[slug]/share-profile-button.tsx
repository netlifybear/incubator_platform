"use client";

import { useCallback, useState } from "react";

type ShareProfileButtonProps = {
  name: string;
  slug: string;
};

export function ShareProfileButton({ name, slug }: ShareProfileButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/founder/${slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name} | Incubator Trust Profile`,
          text: `Check out ${name}'s verified founder reputation profile on Incubator Trust.`,
          url,
        });
        return;
      } catch {
        // user cancelled or API not available — fall through to copy
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [slug, name]);

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-white/70 px-5 py-3 text-sm font-semibold transition hover:bg-white"
    >
      {copied ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share profile
        </>
      )}
    </button>
  );
}
