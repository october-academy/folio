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

// Pragmatic email shape: local@domain.tld, no spaces, single @.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Normalize an email address (trim + lowercase), or null if malformed. */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value
    .trim()
    .replace(/^mailto:/i, "")
    .toLowerCase();
  return EMAIL_PATTERN.test(trimmed) ? trimmed.slice(0, 254) : null;
}

/**
 * Normalize a phone number to a `tel:`-safe string: keep digits, a leading `+`,
 * and common separators. Returns null if it has no digits.
 */
export function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim().replace(/^tel:/i, "");
  const cleaned = raw
    .replace(/[^\d+()\-.\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 4 || digits.length > 20) return null;
  // Allow only a single leading +.
  const plus = cleaned.startsWith("+") ? "+" : "";
  return (plus + cleaned.replace(/\+/g, "")).slice(0, 32);
}

/** The `tel:` href form of a phone number (digits + leading +, no separators). */
export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `tel:${phone.startsWith("+") ? "+" : ""}${digits}`;
}

/**
 * Extract a YouTube video id from a watch/share/embed URL or a bare id.
 * Accepts youtube.com/watch?v=, youtu.be/, /embed/, /shorts/. Ids are 11 chars
 * of `[A-Za-z0-9_-]`. Returns null if none found.
 */
export function extractYouTubeId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const input = value.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1, 12);
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const v = url.searchParams.get("v");
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      const m = url.pathname.match(/\/(?:embed|shorts|v)\/([A-Za-z0-9_-]{11})/);
      if (m) return m[1] ?? null;
    }
    return null;
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
