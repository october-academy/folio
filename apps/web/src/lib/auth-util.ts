// SPDX-License-Identifier: MIT
/**
 * Pure auth helpers — no Cloudflare/server coupling, so they are unit-testable.
 * The token compare + Access-header + DB wiring live in auth.ts / editor-api.ts.
 */
import type { FolioUserRole } from "@folio/core";

export type AuthMode = "token" | "access";

/** Resolve the deploy's auth mode. Default (and back-compat) is single-tenant token. */
export function authModeOf(value: string | undefined | null): AuthMode {
  return value === "access" ? "access" : "token";
}

/** Header Cloudflare Access sets with the authenticated user's email. */
export const ACCESS_EMAIL_HEADER = "cf-access-authenticated-user-email";

/** The first user to sign in becomes the admin; everyone after is a regular user. */
export function roleForNewUser(existingUserCount: number): FolioUserRole {
  return existingUserCount === 0 ? "admin" : "user";
}
