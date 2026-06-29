// SPDX-License-Identifier: MIT
import "server-only";
import type { LinkBlockData } from "@folio/core";
import {
  type AlmanacLink,
  type AlmanacStats,
  almanacShortUrl,
  mintShortCode,
  parseAlmanacLink,
  parseAlmanacLinkStats,
  shortCodeOf,
} from "./almanac-util";
import { getEnv } from "./cf";

/**
 * Almanac integration (optional, first-class). When `ALMANAC_URL` +
 * `ALMANAC_API_KEY` are set, each link block is registered as an Almanac short
 * link so clicks join Almanac's click→signup→revenue ledger (apps/edge). When
 * unset — or on any error — Folio degrades to the standalone PostHog path.
 *
 * Every network call is wrapped so a failure NEVER breaks an edit or a render.
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

/**
 * Register a destination as an Almanac short link. Folio mints the short code, so
 * a 409 ("already exists") on a retry is success — the deterministic code is
 * already live. Returns null on any real failure.
 */
export async function registerLink(params: {
  destination: string;
  label?: string;
  sourceId: string;
  campaign?: string;
}): Promise<AlmanacLink | null> {
  const cfg = config();
  if (!cfg) return null;
  const shortCode = mintShortCode(params.sourceId);
  try {
    const res = await fetch(`${cfg.url}/api/links`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": cfg.key },
      body: JSON.stringify({
        shortCode,
        targetUrl: params.destination,
        ogTitle: params.label,
        channel: FOLIO_CHANNEL,
        ...(params.campaign ? { campaign: params.campaign } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // Already registered (deterministic code) → reuse it.
    if (res.status === 409) {
      return { code: shortCode, short_url: almanacShortUrl(cfg.url, shortCode) };
    }
    if (!res.ok) return null;
    return parseAlmanacLink(await res.json(), cfg.url);
  } catch {
    return null;
  }
}

/**
 * Fetch per-link attribution stats for every Folio-tracked link in one call,
 * keyed by short code. Returns an empty map when Almanac is off or on any error.
 */
export async function getLinkStatsMap(): Promise<Map<string, AlmanacStats>> {
  const cfg = config();
  const map = new Map<string, AlmanacStats>();
  if (!cfg) return map;
  try {
    const res = await fetch(`${cfg.url}/api/links?range=90d&limit=100`, {
      headers: { "x-api-key": cfg.key },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return map;
    const body = (await res.json()) as { links?: unknown };
    const links = Array.isArray(body.links) ? body.links : [];
    for (const row of links) {
      const code = shortCodeOf(row);
      if (code) map.set(code, parseAlmanacLinkStats(row));
    }
    return map;
  } catch {
    return map;
  }
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
