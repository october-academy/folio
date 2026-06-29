// SPDX-License-Identifier: MIT
import "server-only";
import {
  type BlockData,
  type BlockType,
  type FolioBlock,
  type FolioBlockRow,
  type FolioPage,
  type FolioPageRow,
  type LinkBlockData,
  normalizeSettings,
  normalizeSocials,
  normalizeTheme,
  type PageSettingsUpdate,
  type PublicBlock,
  type PublicFolioPage,
} from "@folio/core";
import { shortUrlForCode } from "./almanac";
import { getEnv, getSiteUrl } from "./cf";

function db() {
  return getEnv().DB;
}

function nowMs(): number {
  return Date.now();
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// --- Row → domain ----------------------------------------------------------

function parsePageRow(row: FolioPageRow): FolioPage {
  return {
    id: row.id,
    slug: row.slug,
    owner_id: row.owner_id,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    description: row.description,
    socials: normalizeSocials(safeJsonParse(row.socials, [])),
    theme: normalizeTheme(row.theme),
    settings: normalizeSettings(safeJsonParse(row.settings, {})),
    is_published: row.is_published === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function parseBlockRow(row: FolioBlockRow): FolioBlock {
  return {
    id: row.id,
    page_id: row.page_id,
    type: row.type as BlockType,
    position: row.position,
    is_visible: row.is_visible === 1,
    pinned: row.pinned === 1,
    data: safeJsonParse<BlockData>(row.data, {} as BlockData),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// --- Pages -----------------------------------------------------------------

export async function getPageBySlug(slug: string): Promise<FolioPage | null> {
  const row = await db()
    .prepare("SELECT * FROM pages WHERE slug = ? LIMIT 1")
    .bind(slug.toLowerCase())
    .first<FolioPageRow>();
  return row ? parsePageRow(row) : null;
}

export async function getPageById(id: string): Promise<FolioPage | null> {
  const row = await db()
    .prepare("SELECT * FROM pages WHERE id = ? LIMIT 1")
    .bind(id)
    .first<FolioPageRow>();
  return row ? parsePageRow(row) : null;
}

export async function getOwnerPage(ownerId: string): Promise<FolioPage | null> {
  const row = await db()
    .prepare("SELECT * FROM pages WHERE owner_id = ? ORDER BY created_at ASC LIMIT 1")
    .bind(ownerId)
    .first<FolioPageRow>();
  return row ? parsePageRow(row) : null;
}

/**
 * Single-tenant: return the owner's page, creating a default one on first use.
 */
export async function ensureOwnerPage(ownerId: string): Promise<FolioPage> {
  const existing = await getOwnerPage(ownerId);
  if (existing) return existing;

  const id = crypto.randomUUID();
  const ts = nowMs();
  const slug = await pickInitialSlug();
  await db()
    .prepare(
      `INSERT INTO pages (id, slug, owner_id, display_name, socials, theme, settings, is_published, created_at, updated_at)
       VALUES (?, ?, ?, ?, '[]', 'auto', '{}', 1, ?, ?)`,
    )
    .bind(id, slug, ownerId, "Folio", ts, ts)
    .run();

  const created = await getPageById(id);
  if (!created) throw new Error("Failed to create Folio page");
  return created;
}

async function pickInitialSlug(): Promise<string> {
  if (!(await isSlugTaken("home"))) return "home";
  return `me-${crypto.randomUUID().replace(/-/g, "").slice(0, 6)}`;
}

export async function isSlugTaken(slug: string, exceptPageId?: string): Promise<boolean> {
  const row = await db()
    .prepare("SELECT id FROM pages WHERE slug = ? LIMIT 1")
    .bind(slug.toLowerCase())
    .first<{ id: string }>();
  if (!row) return false;
  return exceptPageId ? row.id !== exceptPageId : true;
}

export async function updatePageSettings(id: string, update: PageSettingsUpdate): Promise<void> {
  const cols: string[] = [];
  const vals: unknown[] = [];
  const set = (col: string, val: unknown) => {
    cols.push(`${col} = ?`);
    vals.push(val);
  };

  if (update.display_name !== undefined) set("display_name", update.display_name);
  if (update.avatar_url !== undefined) set("avatar_url", update.avatar_url);
  if (update.description !== undefined) set("description", update.description);
  if (update.theme !== undefined) set("theme", update.theme);
  if (update.is_published !== undefined) set("is_published", update.is_published ? 1 : 0);
  if (update.socials !== undefined) set("socials", JSON.stringify(update.socials));
  if (update.settings !== undefined) set("settings", JSON.stringify(update.settings));

  if (cols.length === 0) return;
  set("updated_at", nowMs());
  vals.push(id);

  await db()
    .prepare(`UPDATE pages SET ${cols.join(", ")} WHERE id = ?`)
    .bind(...vals)
    .run();
}

export async function updateSlug(id: string, slug: string): Promise<void> {
  await db()
    .prepare("UPDATE pages SET slug = ?, updated_at = ? WHERE id = ?")
    .bind(slug.toLowerCase(), nowMs(), id)
    .run();
}

// --- Blocks ----------------------------------------------------------------

export async function listBlocks(pageId: string): Promise<FolioBlock[]> {
  const { results } = await db()
    .prepare("SELECT * FROM blocks WHERE page_id = ? ORDER BY position ASC, created_at ASC")
    .bind(pageId)
    .all<FolioBlockRow>();
  return (results ?? []).map(parseBlockRow);
}

export async function getBlock(id: string, pageId: string): Promise<FolioBlock | null> {
  const row = await db()
    .prepare("SELECT * FROM blocks WHERE id = ? AND page_id = ? LIMIT 1")
    .bind(id, pageId)
    .first<FolioBlockRow>();
  return row ? parseBlockRow(row) : null;
}

export async function countBlocks(pageId: string): Promise<number> {
  const row = await db()
    .prepare("SELECT COUNT(*) AS n FROM blocks WHERE page_id = ?")
    .bind(pageId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function createBlock(params: {
  pageId: string;
  type: BlockType;
  data: BlockData;
  position: number;
  isVisible: boolean;
}): Promise<FolioBlock> {
  const id = crypto.randomUUID();
  const ts = nowMs();
  await db()
    .prepare(
      `INSERT INTO blocks (id, page_id, type, position, is_visible, pinned, data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    )
    .bind(
      id,
      params.pageId,
      params.type,
      params.position,
      params.isVisible ? 1 : 0,
      JSON.stringify(params.data),
      ts,
      ts,
    )
    .run();
  const created = await getBlock(id, params.pageId);
  if (!created) throw new Error("Failed to create block");
  return created;
}

export async function updateBlock(params: {
  id: string;
  pageId: string;
  type: BlockType;
  data: BlockData;
  position: number;
  isVisible: boolean;
}): Promise<void> {
  await db()
    .prepare(
      `UPDATE blocks SET type = ?, data = ?, position = ?, is_visible = ?, updated_at = ?
       WHERE id = ? AND page_id = ?`,
    )
    .bind(
      params.type,
      JSON.stringify(params.data),
      params.position,
      params.isVisible ? 1 : 0,
      nowMs(),
      params.id,
      params.pageId,
    )
    .run();
}

export async function deleteBlock(id: string, pageId: string): Promise<void> {
  await db().prepare("DELETE FROM blocks WHERE id = ? AND page_id = ?").bind(id, pageId).run();
}

export async function deleteAllBlocks(pageId: string): Promise<void> {
  await db().prepare("DELETE FROM blocks WHERE page_id = ?").bind(pageId).run();
}

/** Insert many blocks in one batch (used by import). */
export async function bulkCreateBlocks(
  pageId: string,
  blocks: Array<{
    type: BlockType;
    data: BlockData;
    position: number;
    isVisible: boolean;
    pinned: boolean;
  }>,
): Promise<void> {
  if (blocks.length === 0) return;
  const ts = nowMs();
  const statements = blocks.map((b) =>
    db()
      .prepare(
        `INSERT INTO blocks (id, page_id, type, position, is_visible, pinned, data, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        pageId,
        b.type,
        b.position,
        b.isVisible ? 1 : 0,
        b.pinned ? 1 : 0,
        JSON.stringify(b.data),
        ts,
        ts,
      ),
  );
  await db().batch(statements);
}

export async function reorderBlocks(
  pageId: string,
  order: Array<{ id: string; position: number }>,
): Promise<void> {
  const ts = nowMs();
  const statements = order.map((b) =>
    db()
      .prepare("UPDATE blocks SET position = ?, updated_at = ? WHERE id = ? AND page_id = ?")
      .bind(b.position, ts, b.id, pageId),
  );
  if (statements.length > 0) await db().batch(statements);
}

/** All block ids on a page (for validating a reorder payload). */
export async function blockIdsOnPage(pageId: string): Promise<Set<string>> {
  const { results } = await db()
    .prepare("SELECT id FROM blocks WHERE page_id = ?")
    .bind(pageId)
    .all<{ id: string }>();
  return new Set((results ?? []).map((r) => r.id));
}

// --- Public view -----------------------------------------------------------

/**
 * Resolve render-time fields on a block's data. For link blocks with an Almanac
 * code, fills in `almanac_url` so the public page links through Almanac (the
 * click→signup→revenue path). No-op when Almanac is off.
 */
function resolveBlockData(block: FolioBlock): BlockData {
  if (block.type !== "link") return block.data;
  const data = block.data as LinkBlockData;
  if (!data.almanac_code) return data;
  const shortUrl = shortUrlForCode(data.almanac_code);
  return shortUrl ? { ...data, almanac_url: shortUrl } : data;
}

export async function getPublicPage(slug: string): Promise<PublicFolioPage | null> {
  const normalizedSlug = slug.trim().replace(/^@/, "").toLowerCase();
  if (!normalizedSlug) return null;

  const page = await getPageBySlug(normalizedSlug);
  if (!page?.is_published) return null;

  const blocks = await listBlocks(page.id);
  const publicBlocks: PublicBlock[] = blocks
    .filter((b) => b.is_visible)
    .map((b) => ({ id: b.id, type: b.type, data: resolveBlockData(b) }));

  const siteUrl = getSiteUrl();
  return {
    slug: page.slug,
    display_name: page.display_name || `@${page.slug}`,
    description: page.description ?? "",
    avatar_url: page.avatar_url,
    theme: page.theme,
    socials: page.socials,
    blocks: publicBlocks,
    page_url: `${siteUrl}/@${page.slug}`,
    og_image_url: `${siteUrl}/api/og/${page.slug}`,
  };
}
