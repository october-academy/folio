"use client";

import { useEffect } from "react";
import { capture } from "@/lib/posthog-client";

/** Fires `folio_page_view` once when a public page mounts (standalone analytics). */
export function FolioTracker({ slug }: { slug: string }) {
  useEffect(() => {
    capture("folio_page_view", { slug });
  }, [slug]);
  return null;
}
