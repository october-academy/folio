// SPDX-License-Identifier: MIT
import "server-only";
import type { FolioUser, FolioUserRole, FolioUserRow } from "@folio/core";
import { roleForNewUser } from "./auth-util";
import { getEnv } from "./cf";

function db() {
  return getEnv().DB;
}

function parseUser(row: FolioUserRow): FolioUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role === "admin" ? "admin" : "user",
    created_at: row.created_at,
  };
}

export async function getUserByEmail(email: string): Promise<FolioUser | null> {
  const row = await db()
    .prepare("SELECT * FROM users WHERE email = ? LIMIT 1")
    .bind(email)
    .first<FolioUserRow>();
  return row ? parseUser(row) : null;
}

async function userCount(): Promise<number> {
  const row = await db().prepare("SELECT COUNT(*) AS n FROM users").first<{ n: number }>();
  return row?.n ?? 0;
}

/**
 * Resolve a user by email, creating one on first sign-in. The first user becomes
 * the admin. Idempotent (a UNIQUE email collision falls back to a re-read).
 */
export async function upsertUserByEmail(email: string): Promise<FolioUser> {
  const existing = await getUserByEmail(email);
  if (existing) return existing;

  const id = crypto.randomUUID();
  const ts = Date.now();
  const role: FolioUserRole = roleForNewUser(await userCount());
  try {
    await db()
      .prepare("INSERT INTO users (id, email, role, created_at) VALUES (?, ?, ?, ?)")
      .bind(id, email, role, ts)
      .run();
  } catch {
    // Lost a race on the UNIQUE(email) index — read the winner.
    const winner = await getUserByEmail(email);
    if (winner) return winner;
    throw new Error("Failed to create user");
  }
  return { id, email, role, created_at: ts };
}
