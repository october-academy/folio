// SPDX-License-Identifier: MIT
/**
 * Pure Almanac helpers — no Cloudflare/server coupling, so they are
 * unit-testable. The HTTP wiring lives in `almanac.ts`.
 *
 * Almanac (the sibling attribution layer, github.com/october-academy/almanac)
 * turns a destination URL into a tracked short link (`{ALMANAC_URL}/{code}`) and
 * joins the resulting clicks to its click→signup→revenue ledger. This module
 * mirrors Almanac's real edge API (apps/edge):
 *   - register:  POST {ALMANAC_URL}/api/links  → { shortUrl, shortCode }
 *   - per-link:  GET  {ALMANAC_URL}/api/links?range= → { links: [{ short_code,
 *                total_clicks, signups, conversions, revenue, first_revenue_at, … }] }
 * Folio MINTS the shortCode (Almanac doesn't generate one). All parsing is
 * defensive so a schema drift degrades to "no stats" rather than throwing.
 */

/** A registered Almanac short link. */
export type AlmanacLink = {
  /** Short code; stored on the block as `almanac_code`. */
  code: string;
  /** Fully-qualified short URL the public page links to (`{ALMANAC_URL}/{code}`). */
  short_url: string;
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

/** Almanac's short-code rule (apps/edge/src/links.ts SHORT_CODE_RE): 3–30 chars. */
const SHORT_CODE_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

/**
 * Mint a deterministic Almanac short code from a Folio block id. Deterministic so
 * re-registering the same block is idempotent (Almanac returns 409 → treated as
 * already-registered). Always satisfies SHORT_CODE_RE.
 */
export function mintShortCode(blockId: string): string {
  const body = blockId
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .slice(0, 24);
  const code = `f${body || "link"}`.slice(0, 30);
  return SHORT_CODE_RE.test(code) ? code : "flink";
}

/** Build the public short-link URL for a code against an Almanac base URL. */
export function almanacShortUrl(base: string, code: string): string {
  return `${base.replace(/\/+$/, "")}/${encodeURIComponent(code)}`;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Parse a `POST /api/links` response ({ shortUrl, shortCode }) into an AlmanacLink. */
export function parseAlmanacLink(value: unknown, base: string): AlmanacLink | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const code = typeof v.shortCode === "string" && v.shortCode ? v.shortCode : null;
  if (!code) return null;
  const short_url =
    typeof v.shortUrl === "string" && v.shortUrl ? v.shortUrl : almanacShortUrl(base, code);
  return { code, short_url };
}

/** The `short_code` of a `/api/links` row (for keying the stats map). */
export function shortCodeOf(value: unknown): string | null {
  const v = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return typeof v.short_code === "string" && v.short_code ? v.short_code : null;
}

/**
 * Map one `/api/links` row to AlmanacStats. `clicks` = lifetime `total_clicks`;
 * `revenue` is converted from Almanac's stored minor units (cents) to major units
 * for display (2-decimal-currency assumption — fine for the indie USD/EUR case).
 */
export function parseAlmanacLinkStats(value: unknown): AlmanacStats {
  const v = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const first = v.first_revenue_at;
  return {
    clicks: num(v.total_clicks),
    signups: num(v.signups),
    conversions: num(v.conversions),
    revenue: Math.round(num(v.revenue)) / 100,
    first_revenue_at: typeof first === "number" && Number.isFinite(first) ? first : null,
  };
}
