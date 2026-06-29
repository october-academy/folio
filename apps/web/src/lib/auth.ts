// SPDX-License-Identifier: MIT
import "server-only";
import { getEnv } from "./cf";

/** Constant-time string compare (edge-safe; no Node Buffer). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

export const ADMIN_COOKIE = "folio_admin";

/**
 * Single-tenant editor auth (v0.1): the request must carry the admin token via
 * `Authorization: Bearer <token>` or the `folio_admin` cookie, matching
 * `FOLIO_ADMIN_TOKEN`. If the token env is unset, the editor is locked.
 */
export function isAuthorized(request: Request): boolean {
  const expected = getEnv().FOLIO_ADMIN_TOKEN;
  if (!expected) return false;

  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  const cookie = readCookie(request.headers.get("cookie"), ADMIN_COOKIE);
  const provided = bearer ?? cookie;
  return !!provided && timingSafeEqual(provided, expected);
}

export function unauthorized(): Response {
  return Response.json({ error: "인증이 필요합니다" }, { status: 401 });
}

/** Returns a 401 Response if unauthorized, else null. */
export function requireAuth(request: Request): Response | null {
  return isAuthorized(request) ? null : unauthorized();
}
