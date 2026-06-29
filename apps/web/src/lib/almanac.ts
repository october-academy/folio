// SPDX-License-Identifier: MIT
import "server-only";
import type { LinkBlockData } from "@folio/core";
import {
  type LinkStatsRow,
  linkCreateRequestSchema,
  linkCreateResponseSchema,
  linksResponseSchema,
} from "./almanac-contract";
import { type AlmanacStats, almanacShortUrl, mintShortCode, toAlmanacStats } from "./almanac-util";
import { getEnv } from "./cf";

/**
 * Almanac integration (optional, first-class). When `ALMANAC_URL` +
 * `ALMANAC_API_KEY` are set, each link block is registered as an Almanac short
 * link so clicks join Almanac's click→signup→revenue ledger (apps/edge). Requests
 * + responses are validated against the explicit zod contract (`almanac-contract.ts`,
 * mirroring `@almanac/contract`). When unset — or on any error / contract mismatch —
 * Folio degrades to the standalone PostHog path; a failure NEVER breaks an edit/render.
 */

const TIMEOUT_MS = 5000;
/** Folio tags every link it registers so Almanac can scope the channel. */
const FOLIO_CHANNEL = "folio";

function config(): { url: string; key: string } | null {
  const env = getEnv();
  if (env.ALMANAC_URL && env.ALMANAC_API_KEY) {
    return { url: env.ALMANAC_URL.replace(/\/+$/, ""), key: env.ALMANAC_API_KEY };
  }
  return null;
}

/** True when Almanac is configured for this deploy. */
export function almanacEnabled(): boolean {
  return config() !== null;
}

/** The public short-link URL for a stored code, or null when Almanac is off. */
export function shortUrlForCode(code: string): string | null {
  const cfg = config();
  return cfg ? almanacShortUrl(cfg.url, code) : null;
}

export type RegisteredLink = { code: string; short_url: string };

/**
 * Register a destination as an Almanac short link. Folio mints the short code, so a
 * 409 ("already exists") on a retry is success — the deterministic code is already
 * live. Returns null on any real failure or contract mismatch.
 */
export async function registerLink(params: {
  destination: string;
  label?: string;
  sourceId: string;
  campaign?: string;
}): Promise<RegisteredLink | null> {
  const cfg = config();
  if (!cfg) return null;
  const shortCode = mintShortCode(params.sourceId);

  // Build + validate the request against the contract before sending.
  const req = linkCreateRequestSchema.safeParse({
    shortCode,
    targetUrl: params.destination,
    ogTitle: params.label || undefined,
    channel: FOLIO_CHANNEL,
    campaign: params.campaign || undefined,
  });
  if (!req.success) return null;

  try {
    const res = await fetch(`${cfg.url}/api/links`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": cfg.key },
      body: JSON.stringify(req.data),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // Already registered (deterministic code) → reuse it.
    if (res.status === 409) {
      return { code: shortCode, short_url: almanacShortUrl(cfg.url, shortCode) };
    }
    if (!res.ok) return null;
    const parsed = linkCreateResponseSchema.safeParse(await res.json());
    if (!parsed.success) return null;
    return { code: parsed.data.shortCode, short_url: parsed.data.shortUrl };
  } catch {
    return null;
  }
}

/**
 * Fetch per-link attribution stats for every Folio-tracked link in one call, keyed
 * by short code. Parsed against the contract; tolerant of per-row drift so one bad
 * row can't blank the whole panel. Empty map when Almanac is off or on any error.
 */
export async function getLinkStatsMap(): Promise<Map<string, AlmanacStats>> {
  const cfg = config();
  const map = new Map<string, AlmanacStats>();
  if (!cfg) return map;
  try {
    // Scope to Folio's own channel so the 100-link window covers Folio's links —
    // not the whole shared Almanac instance (older Folio links would else drop out).
    const res = await fetch(`${cfg.url}/api/links?range=90d&limit=100&channel=${FOLIO_CHANNEL}`, {
      headers: { "x-api-key": cfg.key },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return map;
    const body = await res.json();

    const whole = linksResponseSchema.safeParse(body);
    const rows: LinkStatsRow[] = whole.success ? whole.data.links : extractRows(body); // contract drift → keep the rows that still conform

    for (const row of rows) map.set(row.short_code, toAlmanacStats(row));
    return map;
  } catch {
    return map;
  }
}

/** Row-level salvage: validate each link independently, keep the conforming ones. */
function extractRows(body: unknown): LinkStatsRow[] {
  const raw =
    body && typeof body === "object" && Array.isArray((body as { links?: unknown }).links)
      ? (body as { links: unknown[] }).links
      : [];
  return raw.flatMap((r) => {
    const parsed = linksResponseSchema.shape.links.element.safeParse(r);
    return parsed.success ? [parsed.data] : [];
  });
}

/**
 * Ensure a link block has an Almanac short code, registering one on first save.
 * Returns the (possibly unchanged) data. Idempotent: already-coded links and the
 * disabled case both short-circuit.
 */
export async function ensureAlmanacCode(
  blockId: string,
  data: LinkBlockData,
  campaign?: string,
): Promise<LinkBlockData> {
  if (!almanacEnabled() || data.almanac_code) return data;
  const link = await registerLink({
    destination: data.url,
    label: data.title,
    sourceId: blockId,
    campaign,
  });
  return link ? { ...data, almanac_code: link.code } : data;
}
