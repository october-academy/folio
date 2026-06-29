// SPDX-License-Identifier: MIT
/**
 * Pure Almanac helpers — no Cloudflare/server coupling, so they are unit-testable.
 * The wire shapes are validated against the explicit zod contract (`almanac-contract.ts`,
 * mirroring `@almanac/contract`); the HTTP wiring lives in `almanac.ts`.
 */
import type { LinkStatsRow } from "./almanac-contract";

/** Per-link attribution stats as Folio displays them (revenue in MAJOR units). */
export type AlmanacStats = {
  clicks: number;
  signups: number;
  conversions: number;
  revenue: number;
  /** Epoch ms of the first attributed revenue, or null. */
  first_revenue_at: number | null;
};

/** Almanac's short-code rule (apps/edge SHORT_CODE_RE / contract min(3).max(30)). */
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

/**
 * Map a validated `/api/links` contract row to Folio's display stats. `clicks` uses
 * the lifetime `total_clicks`; revenue is converted from the contract's minor units
 * (cents) to major units for display (2-decimal-currency assumption — the indie case).
 */
export function toAlmanacStats(row: LinkStatsRow): AlmanacStats {
  return {
    clicks: row.total_clicks,
    signups: row.signups,
    conversions: row.conversions,
    revenue: Math.round(row.revenue) / 100,
    first_revenue_at: row.first_revenue_at,
  };
}
