-- Folio v1.0 — multi-user. A user owns one Folio page via pages.owner_id = users.id.
-- Single-tenant deploys (FOLIO_AUTH_MODE=token, the default) never touch this table.

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'user',     -- user|admin (first user → admin)
  created_at  INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
