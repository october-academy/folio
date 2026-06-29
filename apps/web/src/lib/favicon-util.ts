// SPDX-License-Identifier: MIT
/**
 * Pure favicon helpers — no Cloudflare/server coupling, so they are
 * unit-testable and safe to import from client components.
 */

/** A bare hostname like `example.com` (lowercased, no scheme/path). */
export function validHost(host: string): boolean {
  return /^[a-z0-9.-]{3,253}$/.test(host) && host.includes(".") && !host.startsWith(".");
}

/** The upstream favicon-service URL for a host (Google s2, 64px). */
export function faviconUpstreamUrl(host: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
}

/** The self-hosted proxy URL an `<img>` uses for a link with no brand. */
export function faviconProxyUrl(url: string): string {
  return `/api/favicon?u=${encodeURIComponent(url)}`;
}
