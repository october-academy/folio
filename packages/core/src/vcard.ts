// SPDX-License-Identifier: MIT
/**
 * vCard 3.0 generation for the `vcard` block. Pure + dependency-free so the
 * public page can serve a downloadable `.vcf` via a `data:` URI (no extra
 * route, works without client JS).
 */
import type { VCardBlockData } from "./blocks";
import { telHref } from "./validation";

/** Escape a vCard text value (RFC 2426 §5): backslash, comma, semicolon, newline. */
function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Build a vCard 3.0 document from the block data. CRLF line endings per spec. */
export function buildVCard(data: VCardBlockData): string {
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];
  lines.push(`FN:${esc(data.name)}`);
  // N: Family;Given;Additional;Prefix;Suffix — we only have a display name.
  lines.push(`N:${esc(data.name)};;;;`);
  if (data.org) lines.push(`ORG:${esc(data.org)}`);
  if (data.role) lines.push(`TITLE:${esc(data.role)}`);
  if (data.email) lines.push(`EMAIL;TYPE=INTERNET:${esc(data.email)}`);
  if (data.phone) lines.push(`TEL;TYPE=CELL:${esc(telHref(data.phone).replace(/^tel:/, ""))}`);
  if (data.url) lines.push(`URL:${esc(data.url)}`);
  lines.push("END:VCARD");
  return `${lines.join("\r\n")}\r\n`;
}

/** A `data:text/vcard` URI suitable for an `<a href download>` link. */
export function vcardDataUri(data: VCardBlockData): string {
  return `data:text/vcard;charset=utf-8,${encodeURIComponent(buildVCard(data))}`;
}

/** A safe `.vcf` filename derived from the contact name. */
export function vcardFilename(data: VCardBlockData): string {
  const base = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  return `${base || "contact"}.vcf`;
}
