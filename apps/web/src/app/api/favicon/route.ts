// SPDX-License-Identifier: MIT
import { hostnameOf } from "@folio/core";
import { getFavicon } from "@/lib/favicon";

/**
 * GET /api/favicon?u=<link-url>  (or ?host=<host>)
 *
 * Serves a self-hosted, KV-cached favicon for the link's host. On any miss or
 * failure it redirects to the bundled generic icon, so an <img> pointing here
 * always resolves to something. Visitors never contact the upstream service.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const u = searchParams.get("u");
  const host = searchParams.get("host") ?? (u ? hostnameOf(u) : null);
  const fallback = Response.redirect(new URL("/brand-icons/generic-website.svg", request.url), 302);

  if (!host) return fallback;
  const icon = await getFavicon(host);
  if (!icon) return fallback;

  return new Response(icon.bytes, {
    headers: {
      "content-type": icon.contentType,
      // Cache hard at the browser + edge; KV holds the bytes for 30 days.
      "cache-control": "public, max-age=86400, s-maxage=2592000, immutable",
    },
  });
}
