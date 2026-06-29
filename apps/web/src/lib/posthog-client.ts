import posthog from "posthog-js";

let initialized = false;

/** Initialize posthog-js once on the client. No-ops if no key is configured. */
export function initPostHog(): void {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    // Reverse-proxied through /ingest (see next.config rewrites) to dodge blockers.
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: false, // Folio fires its own folio_page_view
    capture_pageleave: true,
    person_profiles: "identified_only",
  });
  initialized = true;
}

/** Capture an event (no-op until posthog is initialized / configured). */
export function capture(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  posthog.capture(event, properties);
}
