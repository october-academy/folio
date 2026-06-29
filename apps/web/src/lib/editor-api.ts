// SPDX-License-Identifier: MIT
import "server-only";
import { type FolioPage, type FolioUserRole, normalizeEmail } from "@folio/core";
import { isAuthorized, unauthorized } from "./auth";
import { ACCESS_EMAIL_HEADER, authModeOf } from "./auth-util";
import { invalidatePage } from "./cache";
import { getEnv, getOwnerId } from "./cf";
import { ensureOwnerPage } from "./db";
import { upsertUserByEmail } from "./users";

export type EditorOwner = { ownerId: string; role: FolioUserRole; email?: string };

/**
 * Resolve the request's owner identity, or null if unauthenticated.
 * - `token` mode (default): the admin token → the single-tenant owner.
 * - `access` mode: the Cloudflare Access email header → a per-user owner (user
 *   row created on first sign-in).
 */
export async function resolveOwner(request: Request): Promise<EditorOwner | null> {
  if (authModeOf(getEnv().FOLIO_AUTH_MODE) === "access") {
    const email = normalizeEmail(request.headers.get(ACCESS_EMAIL_HEADER));
    if (!email) return null;
    const user = await upsertUserByEmail(email);
    return { ownerId: user.id, role: user.role, email: user.email };
  }
  if (!isAuthorized(request)) return null;
  return { ownerId: getOwnerId(), role: "admin" };
}

/**
 * Gate an editor API call and resolve the caller's Folio page (creating it on
 * first use). Returns a 401 Response if unauthorized.
 */
export async function withEditorPage(
  request: Request,
): Promise<{ page: FolioPage; owner: EditorOwner } | Response> {
  const owner = await resolveOwner(request);
  if (!owner) return unauthorized();
  const page = await ensureOwnerPage(owner.ownerId);
  return { page, owner };
}

export function badRequest(error: string, status = 400): Response {
  return Response.json({ error }, { status });
}

/** Invalidate the public KV cache for one or more slugs after an edit. */
export async function invalidate(...slugs: string[]): Promise<void> {
  await Promise.all(slugs.filter(Boolean).map((s) => invalidatePage(s)));
}
