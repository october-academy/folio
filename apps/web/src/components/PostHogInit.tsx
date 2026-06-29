"use client";
// SPDX-License-Identifier: MIT

import { useEffect } from "react";
import { initPostHog } from "@/lib/posthog-client";

/** Initializes posthog-js on the client. Render once in the root layout. */
export function PostHogInit() {
  useEffect(() => {
    initPostHog();
  }, []);
  return null;
}
