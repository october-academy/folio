// SPDX-License-Identifier: MIT
/**
 * Framework-free validation/normalization helpers shared across Folio.
 * Ported (storage-agnostic subset) from the Agentic30 bio server lib.
 */

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

/** Strip HTML, collapse whitespace, trim, and clamp to `maxLength`. */
export function sanitizeText(value: unknown, fallback = "", maxLength = 160): string {
  if (typeof value !== "string") return fallback;
  const normalized = stripHtml(value).replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : fallback;
}

/**
 * Normalize a URL to an https:// string, or null if invalid.
 * `allowHttpLocal` permits http:// for localhost / *.local (dev only).
 */
export function normalizeUrl(
  value: unknown,
  options?: { allowHttpLocal?: boolean },
): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return url.toString();
    if (
      options?.allowHttpLocal &&
      url.protocol === "http:" &&
      (LOCAL_HOSTS.has(url.hostname) || url.hostname.endsWith(".local"))
    ) {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/** Extract the hostname of a URL, lowercased and with a leading `www.` removed. */
export function hostnameOf(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Turn an arbitrary string into a slug candidate (3–30 chars, a–z 0–9 -). */
export function slugify(source: string): string {
  const normalized = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  if (normalized.length >= 3) return normalized.slice(0, 30);
  return `me-${randomId(6)}`;
}

/** Short url-safe random id derived from a UUID (no external dep). */
export function randomId(length = 8): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, length);
}
