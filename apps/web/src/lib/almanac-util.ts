// SPDX-License-Identifier: MIT
/**
 * Pure Almanac helpers — no Cloudflare/server coupling, so they are
 * unit-testable. The HTTP wiring lives in `almanac.ts`.
 *
 * Almanac (the sibling attribution layer) turns a destination URL into a tracked
 * short link carrying a `click_id`, and joins the resulting clicks to its
 * click→signup→revenue ledger. This module defines the request/response contract
 * Folio integrates against; it is intentionally defensive so a schema drift on
 * the Almanac side degrades to "no stats" rather than throwing.
 */

/** A registered Almanac short link. */
export type AlmanacLink = {
  /** Short code; stored on the block as `almanac_code`. */
  code: string;
  /** Fully-qualified short URL the public page links to. */
  short_url: string;
  /** Opaque click id seed (optional; Almanac may assign per-click). */
  click_id?: string;
};

/** Per-link attribution stats (all counts default to 0). */
export type AlmanacStats = {
  clicks: number;
  signups: number;
  conversions: number;
  revenue: number;
  /** Epoch ms of the first attributed revenue, or null. */
  first_revenue_at: number | null;
};

/** Build the public short-link URL for a code against an Almanac base URL. */
export function almanacShortUrl(base: string, code: string): string {
  return `${base.replace(/\/+$/, "")}/l/${encodeURIComponent(code)}`;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Parse a `POST /api/links` response into an AlmanacLink, or null if unusable. */
export function parseAlmanacLink(value: unknown, base: string): AlmanacLink | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const code = typeof v.code === "string" && v.code ? v.code : null;
  if (!code) return null;
  const short_url =
    typeof v.short_url === "string" && v.short_url ? v.short_url : almanacShortUrl(base, code);
  return {
    code,
    short_url,
    ...(typeof v.click_id === "string" ? { click_id: v.click_id } : {}),
  };
}

/** Parse a `GET /api/links/:code/stats` response defensively. */
export function parseAlmanacStats(value: unknown): AlmanacStats {
  const v = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const first = v.first_revenue_at;
  return {
    clicks: num(v.clicks),
    signups: num(v.signups),
    conversions: num(v.conversions),
    revenue: num(v.revenue),
    first_revenue_at: typeof first === "number" && Number.isFinite(first) ? first : null,
  };
}
