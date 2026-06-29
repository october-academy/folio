import "server-only";
import type { PublicFolioPage } from "@folio/core";
import { getEnv } from "./cf";

const TTL_SECONDS = 300;
const key = (slug: string) => `page:${slug.toLowerCase()}`;

/**
 * KV cache of the rendered public-page payload (cache-aside). On any KV error
 * we treat it as a miss so the page still renders from D1 — KV is an accelerator,
 * not the source of truth.
 */
export async function getCachedPage(slug: string): Promise<PublicFolioPage | null> {
  try {
    return await getEnv().FOLIO_CACHE.get<PublicFolioPage>(key(slug), "json");
  } catch {
    return null;
  }
}

export async function setCachedPage(slug: string, payload: PublicFolioPage): Promise<void> {
  try {
    await getEnv().FOLIO_CACHE.put(key(slug), JSON.stringify(payload), {
      expirationTtl: TTL_SECONDS,
    });
  } catch {
    // best-effort cache write
  }
}

/** Invalidate a slug's cached payload (called on every edit). */
export async function invalidatePage(slug: string): Promise<void> {
  try {
    await getEnv().FOLIO_CACHE.delete(key(slug));
  } catch {
    // best-effort
  }
}
