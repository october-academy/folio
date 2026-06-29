"use client";

import { initPostHog } from "@/lib/posthog-client";
import { useEffect } from "react";

/** Initializes posthog-js on the client. Render once in the root layout. */
export function PostHogInit() {
  useEffect(() => {
    initPostHog();
  }, []);
  return null;
}
