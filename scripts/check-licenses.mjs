#!/usr/bin/env node
// SPDX-License-Identifier: MIT
/**
 * MIT-gate — fail the build if any package in the *resolved* dependency graph is
 * copyleft-incompatible with MIT (AGPL / GPL / SSPL). Folio is MIT and must carry
 * no copyleft runtime dependency (SPEC §13).
 *
 *   node scripts/check-licenses.mjs
 *
 * Design (hardened):
 *  - Walks the FULL installed graph via the bun store (node_modules/.bun/<name@ver>),
 *    so transitive deps are inspected too — not only the direct deps the manifests
 *    declare.
 *  - When a package's `license` field is a sentinel ("SEE LICENSE IN ...", UNLICENSED,
 *    LicenseRef-*, or missing), it READS the LICENSE/COPYING file text and scans it for
 *    copyleft terms, instead of trusting the self-declared field.
 *  - Evaluates SPDX OR/AND expressions properly: "MIT OR GPL-2.0" is usable under MIT
 *    (pass); "MIT AND GPL-2.0" requires GPL compliance (fail).
 *  - HARD_DENY catches known-AGPL packages (ua-parser-js) by name regardless of the
 *    declared license. LGPL is tolerated (dynamic-link copyleft).
 *
 * Zero third-party deps — Node built-ins only — so the gate itself stays MIT-clean.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Packages that are AGPL/copyleft and must never appear in the graph, by name. */
const HARD_DENY = ["ua-parser-js"];

/** SPDX ids that are safe to depend on. */
const PERMISSIVE =
  /^(MIT|MIT-0|ISC|0BSD|BSD-2-Clause|BSD-3-Clause|Apache-2\.0|Unlicense|CC0-1\.0|BlueOak-1\.0\.0|Python-2\.0|Zlib|WTFPL|MPL-2\.0)$/i;

/** License-text markers that corroborate a permissive license. */
const PERMISSIVE_TEXT =
  /(MIT License|Apache License|BSD \d-Clause|ISC License|Mozilla Public License|The Unlicense|CC0 1\.0|Zlib)/i;

/** Strong copyleft incompatible with MIT redistribution (excludes LGPL). */
function isCopyleft(s) {
  if (/AGPL/i.test(s) || /SSPL/i.test(s)) return true;
  if (/GPL/i.test(s) && !/LGPL/i.test(s)) return true;
  return false;
}

const SENTINEL = /^(SEE LICENSE|UNLICENSED|LicenseRef|CUSTOM|OTHER)/i;

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function licenseField(pkg) {
  if (!pkg) return null;
  if (typeof pkg.license === "string") return pkg.license;
  if (pkg.license?.type) return pkg.license.type;
  if (Array.isArray(pkg.licenses)) {
    return pkg.licenses.map((l) => l.type ?? l).join(" OR ");
  }
  return null;
}

/** "ok" | "deny" | "unknown" for an SPDX expression string. */
function evalSpdx(expr) {
  const clean = expr.replace(/[()]/g, " ").trim();
  if (/\sOR\s/i.test(clean)) {
    const terms = clean.split(/\sOR\s/i).map((t) => t.trim());
    if (terms.some((t) => PERMISSIVE.test(t))) return "ok"; // usable under a permissive term
    if (terms.some(isCopyleft)) return "deny";
    return "unknown";
  }
  if (/\sAND\s/i.test(clean)) {
    const terms = clean.split(/\sAND\s/i).map((t) => t.trim());
    if (terms.some(isCopyleft)) return "deny"; // must satisfy every term
    if (terms.every((t) => PERMISSIVE.test(t))) return "ok";
    return "unknown";
  }
  if (isCopyleft(clean)) return "deny";
  if (PERMISSIVE.test(clean)) return "ok";
  return "unknown";
}

const LICENSE_FILES = [
  "LICENSE",
  "LICENSE.md",
  "LICENSE.txt",
  "LICENCE",
  "LICENCE.md",
  "COPYING",
  "COPYING.md",
];

/** Scan a package's LICENSE/COPYING text: "deny" | "ok" | "unknown". */
function scanLicenseText(pkgDir) {
  for (const name of LICENSE_FILES) {
    const path = join(pkgDir, name);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    if (isCopyleft(text)) return "deny";
    if (PERMISSIVE_TEXT.test(text)) return "ok";
    return "unknown";
  }
  return "unknown";
}

/** Classify one installed package directory. */
function classify(pkgDir, pkg) {
  const field = licenseField(pkg);
  if (field && !SENTINEL.test(field)) {
    const verdict = evalSpdx(field);
    if (verdict !== "unknown") return { verdict, label: field };
    const fromText = scanLicenseText(pkgDir);
    return { verdict: fromText === "deny" ? "deny" : "unknown", label: field };
  }
  // Sentinel or missing field → the field is untrustworthy; read the text.
  return {
    verdict: scanLicenseText(pkgDir),
    label: field ?? "(no license field)",
  };
}

/** Reconstruct a package name + its dir from a bun-store entry like "@a+b@1.2.3". */
function parseStoreEntry(entry) {
  const match = /^(.+)@([^@]+)$/.exec(entry);
  if (!match) return null;
  const rawName = match[1];
  const name = rawName.startsWith("@") ? rawName.replace("+", "/") : rawName;
  return { name, version: match[2], dir: entry };
}

function* installedPackages() {
  const store = join(ROOT, "node_modules", ".bun");
  if (!existsSync(store)) return;
  for (const entry of readdirSync(store)) {
    const parsed = parseStoreEntry(entry);
    if (!parsed || parsed.name.startsWith("@folio/")) continue;
    const pkgDir = join(store, entry, "node_modules", ...parsed.name.split("/"));
    const pkg = readJson(join(pkgDir, "package.json"));
    if (!pkg) continue;
    yield { ...parsed, pkgDir, pkg };
  }
}

const denied = [];
const unknown = [];
let okCount = 0;

const seen = new Set();
for (const p of installedPackages()) {
  if (seen.has(p.name)) continue;
  seen.add(p.name);

  if (HARD_DENY.includes(p.name)) {
    denied.push(`${p.name}@${p.version}: on the AGPL hard-deny list`);
    continue;
  }

  const { verdict, label } = classify(p.pkgDir, p.pkg);
  if (verdict === "deny") {
    denied.push(`${p.name}@${p.version}: ${label}`);
  } else if (verdict === "unknown") {
    unknown.push(`${p.name}@${p.version}: ${label}`);
  } else {
    okCount += 1;
  }
}

console.log(`Checked ${seen.size} resolved package(s) in the dependency graph.`);
if (unknown.length > 0) {
  console.warn(`\n  ${unknown.length} with an unrecognized license (manual review):`);
  for (const u of unknown) console.warn(`  ? ${u}`);
}

if (denied.length > 0) {
  console.error("\n✗ MIT-gate FAILED — copyleft dependency in the graph:");
  for (const d of denied) console.error(`  - ${d}`);
  console.error("\nFolio must carry no AGPL/GPL/SSPL runtime dependency (SPEC §13).");
  process.exit(1);
}

console.log(`\n✓ MIT-gate passed: ${okCount} permissive, no AGPL/GPL/SSPL in the resolved graph.`);
