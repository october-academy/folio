#!/usr/bin/env node
// SPDX-License-Identifier: MIT
/**
 * Vendor the monorepo SSOT (@folio/core + @folio/buttons) into apps/web so the
 * app is self-contained and Cloudflare's "Deploy to Cloudflare" button can build
 * from the apps/web subdirectory alone (it treats that subtree as the repo root).
 *
 * SSOT lives in packages/{core,buttons}. This copies:
 *   - TS sources → src/vendor/{core,buttons}/  (resolved via the @folio/* tsconfig
 *     path aliases, so app import statements stay `@folio/core` / `@folio/buttons`)
 *   - brands.css → src/app/brands.css   ·   icons → public/brand-icons/
 * The vendored copies ARE committed — never hand-edit them; edit packages/ instead.
 *
 * Runs on predev/prebuild. When packages/ is absent (a clone of only the apps/web
 * subtree, as the deploy button produces), it skips gracefully and the committed
 * copies are used as-is. Idempotent.
 */
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, "..");
const packages = join(web, "..", "..", "packages");

if (!existsSync(packages)) {
  console.log("• packages/ absent — using committed vendor copies (deploy-button build)");
  process.exit(0);
}

const buttons = join(packages, "buttons");

/** Copy a package's TS sources (skipping tests) into a vendor dir, replacing it. */
function vendorSrc(fromDir, toDir) {
  rmSync(toDir, { recursive: true, force: true });
  mkdirSync(toDir, { recursive: true });
  for (const file of readdirSync(fromDir)) {
    if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
    if (!/\.(ts|tsx)$/.test(file)) continue;
    copyFileSync(join(fromDir, file), join(toDir, file));
  }
}

vendorSrc(join(packages, "core", "src"), join(web, "src", "vendor", "core"));
vendorSrc(join(buttons, "src"), join(web, "src", "vendor", "buttons"));

// Brand assets Next serves directly (CSS @import + <img> from /brand-icons).
mkdirSync(join(web, "src", "app"), { recursive: true });
mkdirSync(join(web, "public", "brand-icons"), { recursive: true });
copyFileSync(join(buttons, "brands.css"), join(web, "src", "app", "brands.css"));
cpSync(join(buttons, "icons"), join(web, "public", "brand-icons"), { recursive: true });

console.log("✓ vendored @folio/core + @folio/buttons (src/vendor) + brand assets");
