import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Cloudflare bindings + vars (D1, KV, secrets). Works in request scope and dev. */
export function getEnv(): CloudflareEnv {
  return getCloudflareContext().env;
}

export function getSiteUrl(): string {
  const url = getEnv().NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

/** The opaque owner id for the single Folio page on this deploy (single-tenant v0.1). */
export function getOwnerId(): string {
  return getEnv().FOLIO_OWNER_ID ?? "owner";
}

/** True in non-production (allows http://localhost links in the editor). */
export function allowHttpLocal(): boolean {
  return process.env.NODE_ENV !== "production";
}
