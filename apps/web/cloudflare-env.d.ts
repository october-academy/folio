import type { D1Database, Fetcher, KVNamespace } from "@cloudflare/workers-types";

declare global {
  /** Bindings + vars available via `getCloudflareContext().env`. */
  interface CloudflareEnv {
    /** D1 database holding `pages` + `blocks`. */
    DB: D1Database;
    /** KV namespace caching the rendered public-page payload by slug. */
    FOLIO_CACHE: KVNamespace;
    /** Static assets (OpenNext). */
    ASSETS: Fetcher;

    /** Editor admin token (single-tenant v0.1). */
    FOLIO_ADMIN_TOKEN: string;
    /** Opaque owner id for the single Folio on this deploy. */
    FOLIO_OWNER_ID?: string;

    NEXT_PUBLIC_POSTHOG_KEY?: string;
    NEXT_PUBLIC_POSTHOG_HOST?: string;
    NEXT_PUBLIC_SITE_URL?: string;

    /** Almanac integration (optional, v0.2). */
    ALMANAC_URL?: string;
    ALMANAC_API_KEY?: string;
  }
}
