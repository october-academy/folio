-- Folio D1 schema (SSOT). Applied to the apps/web D1 binding via wrangler.
-- No Supabase, no profiles FK, no RLS — single-tenant in v0.1.

CREATE TABLE IF NOT EXISTS pages (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,             -- /@slug  ^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$
  owner_id      TEXT,                             -- opaque owner (single-tenant v0.1 = a constant)
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  description   TEXT,
  socials       TEXT NOT NULL DEFAULT '[]',       -- json: [{ brand, url }]
  theme         TEXT NOT NULL DEFAULT 'auto',     -- auto|light|dark|<custom>
  settings      TEXT NOT NULL DEFAULT '{}',       -- json (flexible)
  is_published  INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER,
  updated_at    INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_slug ON pages (slug);
CREATE INDEX IF NOT EXISTS idx_pages_owner ON pages (owner_id);

CREATE TABLE IF NOT EXISTS blocks (
  id          TEXT PRIMARY KEY,
  page_id     TEXT NOT NULL,                       -- FK pages.id (cascade enforced in app)
  type        TEXT NOT NULL,                       -- link|heading|text|divider
  position    INTEGER NOT NULL DEFAULT 0,
  is_visible  INTEGER NOT NULL DEFAULT 1,
  pinned      INTEGER NOT NULL DEFAULT 0,          -- "up_link"
  data        TEXT NOT NULL DEFAULT '{}',          -- json, per-type
  created_at  INTEGER,
  updated_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_blocks_page_position ON blocks (page_id, position);
