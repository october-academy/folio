// SPDX-License-Identifier: MIT
import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

// The OG image route declares `export const runtime = "edge"` itself. On Cloudflare
// (a single workerd runtime) there is no benefit to splitting it into a separate
// edge function — and doing so tripped OpenNext's edge-bundle asset copy on the
// Next-bundled Geist font (ENOENT in cf:build). So we keep the default config.
export default defineCloudflareConfig({});
