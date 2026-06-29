#!/usr/bin/env node
// SPDX-License-Identifier: MIT
/**
 * Copy LittleLink brand assets from @folio/buttons into the web app so Next can
 * serve them: brands.css → src/app/brands.css, icons → public/brand-icons/.
 * Runs on predev/prebuild. Idempotent.
 */
import { copyFileSync, cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, "..");
const buttons = join(web, "..", "..", "packages", "buttons");

mkdirSync(join(web, "src", "app"), { recursive: true });
mkdirSync(join(web, "public", "brand-icons"), { recursive: true });

copyFileSync(join(buttons, "brands.css"), join(web, "src", "app", "brands.css"));
cpSync(join(buttons, "icons"), join(web, "public", "brand-icons"), {
  recursive: true,
});

console.log("✓ synced @folio/buttons assets (brands.css + brand-icons)");
