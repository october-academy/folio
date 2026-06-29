#!/usr/bin/env node
/**
 * MIT gate — fail the build if any installed dependency is (A)GPL-licensed.
 *
 * Folio is MIT and must carry no copyleft runtime dependency (SPEC §13). This
 * walks the hoisted node_modules trees, reads each package's `license` field,
 * and exits non-zero if anything in the GPL family is found. Zero deps; runs in
 * plain Node.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Copyleft license SPDX ids / substrings that are disqualifying for an MIT product.
const BLOCKED = [/\bAGPL/i, /\bGPL-/i, /\bGPL\b/i, /\bSSPL/i];
// LGPL is tolerated (dynamic-link copyleft); list here to avoid false positives.
const ALLOWLIST = [/\bLGPL/i];

/** Read a package.json's normalized license string, or null. */
function licenseOf(pkgDir) {
  const pkgPath = join(pkgDir, "package.json");
  if (!existsSync(pkgPath)) return null;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    if (typeof pkg.license === "string") return { name: pkg.name, license: pkg.license };
    if (pkg.license && typeof pkg.license.type === "string")
      return { name: pkg.name, license: pkg.license.type };
    if (Array.isArray(pkg.licenses))
      return { name: pkg.name, license: pkg.licenses.map((l) => l.type).join(" OR ") };
    return { name: pkg.name ?? pkgDir, license: "UNKNOWN" };
  } catch {
    return null;
  }
}

/** Collect every package dir under a node_modules folder (handles @scope/*). */
function packageDirs(nodeModules) {
  if (!existsSync(nodeModules)) return [];
  const out = [];
  for (const entry of readdirSync(nodeModules)) {
    if (entry === ".bin" || entry === ".cache") continue;
    const full = join(nodeModules, entry);
    if (!statSync(full).isDirectory()) continue;
    if (entry.startsWith("@")) {
      for (const scoped of readdirSync(full)) {
        const scopedFull = join(full, scoped);
        if (statSync(scopedFull).isDirectory()) out.push(scopedFull);
      }
    } else {
      out.push(full);
    }
    // one level of nested node_modules (non-hoisted deps)
    const nested = join(full, "node_modules");
    if (existsSync(nested)) out.push(...packageDirs(nested));
  }
  return out;
}

const seen = new Set();
const offenders = [];
const roots = [
  join(ROOT, "node_modules"),
  join(ROOT, "apps", "web", "node_modules"),
  join(ROOT, "packages", "core", "node_modules"),
  join(ROOT, "packages", "buttons", "node_modules"),
];

for (const nm of roots) {
  for (const dir of packageDirs(nm)) {
    if (seen.has(dir)) continue;
    seen.add(dir);
    const info = licenseOf(dir);
    if (!info) continue;
    const lic = info.license;
    if (ALLOWLIST.some((re) => re.test(lic))) continue;
    if (BLOCKED.some((re) => re.test(lic))) {
      offenders.push(`${info.name} — ${lic}`);
    }
  }
}

if (offenders.length > 0) {
  console.error("✗ MIT gate FAILED — copyleft dependency detected:");
  for (const o of offenders) console.error(`    ${o}`);
  console.error("\nFolio must carry no (A)GPL runtime dependency (SPEC §13).");
  process.exit(1);
}

console.log(`✓ MIT gate passed — scanned ${seen.size} packages, no (A)GPL deps.`);
