// SPDX-License-Identifier: MIT
import "server-only";
import type { FolioPage } from "@folio/core";
import { requireAuth } from "./auth";
import { invalidatePage } from "./cache";
import { getOwnerId } from "./cf";
import { ensureOwnerPage } from "./db";

/**
 * Gate an editor API call by the admin token and resolve the single-tenant page
 * (creating it on first use). Returns a 401 Response if unauthorized.
 */
export async function withEditorPage(request: Request): Promise<{ page: FolioPage } | Response> {
  const unauthorized = requireAuth(request);
  if (unauthorized) return unauthorized;
  const page = await ensureOwnerPage(getOwnerId());
  return { page };
}

export function badRequest(error: string, status = 400): Response {
  return Response.json({ error }, { status });
}

/** Invalidate the public KV cache for one or more slugs after an edit. */
export async function invalidate(...slugs: string[]): Promise<void> {
  await Promise.all(slugs.filter(Boolean).map((s) => invalidatePage(s)));
}
