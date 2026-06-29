// SPDX-License-Identifier: MIT
import "server-only";
import { getEnv } from "./cf";
import { faviconUpstreamUrl, validHost } from "./favicon-util";

/**
 * Favicon resolution for link blocks whose host has no LittleLink brand.
 *
 * Privacy-first, clean-room of LinkStack's favicon-fetch idea: Folio fetches the
 * icon from a third-party favicon service *server-side*, caches the bytes in KV,
 * and self-serves them — so a public-page visitor's browser only ever contacts
 * Folio, never Google/DuckDuckGo. Disable entirely with `FOLIO_FAVICON=off`.
 */

const POSITIVE_TTL = 60 * 60 * 24 * 30; // 30 days
const NEGATIVE_TTL = 60 * 60; // 1 hour — don't hammer a host that has no icon
const MAX_BYTES = 100 * 1024; // ignore oversized responses

const keyFor = (host: string) => `favicon:${host}`;

/** True when third-party favicon fetching is turned off via env. */
export function faviconDisabled(): boolean {
  return (getEnv().FOLIO_FAVICON ?? "").toLowerCase() === "off";
}

type Icon = { bytes: ArrayBuffer; contentType: string };

async function fetchUpstream(host: string): Promise<Icon | null> {
  try {
    const res = await fetch(faviconUpstreamUrl(host), {
      headers: { accept: "image/*" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/png";
    if (!contentType.startsWith("image/")) return null;
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return null;
    return { bytes, contentType };
  } catch {
    return null;
  }
}

/**
 * Resolve a host's favicon bytes (KV cache-aside, with negative caching).
 * Returns null when disabled, invalid, or unresolvable (caller serves fallback).
 */
export async function getFavicon(host: string): Promise<Icon | null> {
  if (faviconDisabled() || !validHost(host)) return null;

  const kv = getEnv().FOLIO_CACHE;
  try {
    const cached = await kv.getWithMetadata<{ ct?: string; miss?: boolean }>(
      keyFor(host),
      "arrayBuffer",
    );
    if (cached.metadata?.miss) return null; // negative-cached
    if (cached.value && cached.metadata?.ct) {
      return { bytes: cached.value, contentType: cached.metadata.ct };
    }
  } catch {
    // KV unavailable → fall through to a live fetch.
  }

  const icon = await fetchUpstream(host);
  try {
    if (!icon) {
      await kv.put(keyFor(host), "x", { metadata: { miss: true }, expirationTtl: NEGATIVE_TTL });
      return null;
    }
    await kv.put(keyFor(host), icon.bytes, {
      metadata: { ct: icon.contentType },
      expirationTtl: POSITIVE_TTL,
    });
  } catch {
    // best-effort cache write
  }
  return icon;
}
