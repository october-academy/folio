// SPDX-License-Identifier: MIT
/**
 * The explicit Folio↔Almanac wire contract, in zod.
 *
 * SSOT: `@almanac/contract` (github.com/october-academy/almanac `packages/contract`).
 * Vendored here — the Folio-relevant subset, kept byte-faithful to upstream — so Folio
 * stays standalone-deployable (no cross-repo/unpublished dependency). When
 * `@almanac/contract` is published, swap these for `import … from "@almanac/contract"`.
 *
 * Folio registers links + reads per-link rollups by PARSING with these schemas
 * (graceful-degrade on failure) instead of hand-rolled defensive checks. Money is in
 * MINOR units (cents); timestamps are epoch milliseconds.
 */
import { z } from "zod";

export const rangeSchema = z.enum(["24h", "7d", "30d", "90d"]);
export type Range = z.infer<typeof rangeSchema>;

/** `POST /api/links` body. The consumer (Folio) mints `shortCode` (deterministic =
 * idempotent; a duplicate returns HTTP 409, treated as "already registered"). */
export const linkCreateRequestSchema = z.object({
  shortCode: z.string().min(3).max(30),
  targetUrl: z.string().url(),
  ogTitle: z.string().max(300).optional(),
  ogDescription: z.string().max(300).optional(),
  ogImageUrl: z.string().url().optional(),
  campaign: z.string().optional(),
  channel: z.string().optional(),
  ownerId: z.string().optional(),
});
export type LinkCreateRequest = z.infer<typeof linkCreateRequestSchema>;

/** `POST /api/links` 201 response. */
export const linkCreateResponseSchema = z.object({
  shortUrl: z.string().url(),
  shortCode: z.string(),
});
export type LinkCreateResponse = z.infer<typeof linkCreateResponseSchema>;

/**
 * One row of `GET /api/links` — a link plus its attribution rollup. `clicks` is the
 * windowed count; `total_clicks` is lifetime (what Folio displays). The rollup fields
 * join clicks → identities (signups) → conversions (revenue) for the link.
 */
export const linkStatsRowSchema = z.object({
  short_code: z.string(),
  short_url: z.string(),
  target_url: z.string(),
  target_host: z.string().nullable(),
  campaign: z.string().nullable(),
  channel: z.string().nullable(),
  created_at: z.number(),
  archived: z.number(),
  clicks: z.number(),
  total_clicks: z.number(),
  signups: z.number(),
  conversions: z.number(),
  /** Summed paid revenue in MINOR units (cents). */
  revenue: z.number(),
  first_revenue_at: z.number().nullable(),
});
export type LinkStatsRow = z.infer<typeof linkStatsRowSchema>;

export const linksResponseSchema = z.object({
  range: rangeSchema,
  links: z.array(linkStatsRowSchema),
});
export type LinksResponse = z.infer<typeof linksResponseSchema>;
