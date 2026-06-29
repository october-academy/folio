"use client";

import { capture } from "@/lib/posthog-client";
import { useEffect } from "react";

/** Fires `folio_page_view` once when a public page mounts (standalone analytics). */
export function FolioTracker({ slug }: { slug: string }) {
  useEffect(() => {
    capture("folio_page_view", { slug });
  }, [slug]);
  return null;
}
