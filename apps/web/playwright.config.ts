// SPDX-License-Identifier: MIT
import { defineConfig, devices } from "@playwright/test";

/**
 * Runs the Folio acceptance e2e against a live dev server.
 *
 * Prerequisites (the harness can't spin up D1/PostHog, so this runs in a real
 * dev environment):
 *   1. apps/web/.dev.vars has FOLIO_ADMIN_TOKEN + a NEXT_PUBLIC_POSTHOG_KEY
 *      (any non-empty value; the test intercepts /ingest so no real PostHog).
 *   2. `bunx wrangler d1 migrations apply folio --local`
 *   3. `bun run dev`  (http://localhost:3000)
 *   4. FOLIO_ADMIN_TOKEN=<same> bunx playwright test
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
