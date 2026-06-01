"use client";

import { useEffect } from "react";
import { incrementProfileView } from "./actions";

type ProfileViewTrackerProps = {
  disabled?: boolean;
  slug: string;
};

export function ProfileViewTracker({ disabled = false, slug }: ProfileViewTrackerProps) {
  useEffect(() => {
    if (disabled) return;

    void incrementProfileView(slug);
  }, [disabled, slug]);

  return null;
}
