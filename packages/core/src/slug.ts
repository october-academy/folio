/**
 * Slug rules for Folio public pages (`/@slug` and `/[slug]`).
 * Pattern matches the Agentic30 bio slug rule: 3–30 chars, a–z 0–9 and hyphen,
 * not starting/ending with a hyphen.
 */
import { sanitizeText } from "./validation.js";

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

/**
 * Slugs reserved for system routes — a page may not claim these, or it would
 * shadow `/admin`, `/api/*`, OG images, framework assets, etc.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "admin",
  "api",
  "_next",
  "og",
  "l",
  "login",
  "logout",
  "auth",
  "assets",
  "static",
  "public",
  "fonts",
  "images",
  "favicon",
  "robots",
  "sitemap",
  "manifest",
  "health",
  "settings",
  "dashboard",
  "new",
  "edit",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export type SlugValidation = { slug: string } | { error: string; status: 400 | 409 };

/** Validate + normalize a raw slug input (does not check uniqueness). */
export function validateSlug(input: unknown): SlugValidation {
  const normalized = sanitizeText(input, "", 30).toLowerCase();
  if (!SLUG_PATTERN.test(normalized)) {
    return { error: "slug는 3-30자의 소문자/숫자/하이픈만 가능합니다", status: 400 };
  }
  if (isReservedSlug(normalized)) {
    return { error: "예약된 slug입니다", status: 400 };
  }
  return { slug: normalized };
}
