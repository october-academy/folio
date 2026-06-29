// SPDX-License-Identifier: MIT
import "server-only";
import type { PublicFolioPage } from "@folio/core";
import { getCachedPage, setCachedPage } from "./cache";
import { getPublicPage } from "./db";

/** Load a public page, KV-cache-aside. Returns null if not found/unpublished. */
export async function loadPublicPage(slug: string): Promise<PublicFolioPage | null> {
  const cached = await getCachedPage(slug);
  if (cached) return cached;
  const page = await getPublicPage(slug);
  if (page) await setCachedPage(page.slug, page);
  return page;
}
