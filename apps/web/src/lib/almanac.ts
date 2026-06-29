// SPDX-License-Identifier: MIT
import "server-only";
import type { LinkBlockData } from "@folio/core";
import {
  type AlmanacLink,
  type AlmanacStats,
  almanacShortUrl,
  parseAlmanacLink,
  parseAlmanacStats,
} from "./almanac-util";
import { getEnv } from "./cf";

/**
 * Almanac integration (optional, first-class). When `ALMANAC_URL` +
 * `ALMANAC_API_KEY` are set, each link block is registered as an Almanac short
 * link (click_id) so clicks join Almanac's click→signup→revenue ledger. When
 * unset — or on any error — Folio degrades to the standalone PostHog path.
 *
 * Every network call is wrapped so a failure NEVER breaks an edit or a render.
 */

const TIMEOUT_MS = 5000;

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

/** Register a destination as an Almanac short link. Returns null on any failure. */
export async function registerLink(params: {
  destination: string;
  label?: string;
  sourceId: string;
}): Promise<AlmanacLink | null> {
  const cfg = config();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/api/links`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify({
        destination: params.destination,
        label: params.label,
        source: "folio",
        source_id: params.sourceId,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return parseAlmanacLink(await res.json(), cfg.url);
  } catch {
    return null;
  }
}

/** Read per-link attribution stats for a code. Returns null on any failure. */
export async function getLinkStats(code: string): Promise<AlmanacStats | null> {
  const cfg = config();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/api/links/${encodeURIComponent(code)}/stats`, {
      headers: { authorization: `Bearer ${cfg.key}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return parseAlmanacStats(await res.json());
  } catch {
    return null;
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
): Promise<LinkBlockData> {
  if (!almanacEnabled() || data.almanac_code) return data;
  const link = await registerLink({
    destination: data.url,
    label: data.title,
    sourceId: blockId,
  });
  return link ? { ...data, almanac_code: link.code } : data;
}
