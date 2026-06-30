// SPDX-License-Identifier: MIT
/**
 * Portable Folio export/import (v1.0). A `FolioExport` is a self-contained,
 * id-free JSON snapshot of a page + its blocks — suitable for backup, transfer,
 * or seeding. Pure + storage-agnostic so it is unit-testable.
 */
import { type BlockData, type BlockType, MAX_BLOCKS, normalizeBlockData } from "./blocks";
import {
  type FolioSettings,
  normalizeSettings,
  normalizeSocials,
  normalizeTheme,
  type Social,
  type Theme,
} from "./page";
import type { FolioBlock, FolioPage } from "./types";
import { normalizeUrl, sanitizeText } from "./validation";

export const FOLIO_EXPORT_VERSION = 1;

export type ExportedBlock = {
  type: BlockType;
  position: number;
  is_visible: boolean;
  pinned: boolean;
  data: BlockData;
};

export type FolioExport = {
  folio_export_version: number;
  exported_at: number | null;
  page: {
    slug: string;
    display_name: string;
    description: string | null;
    avatar_url: string | null;
    theme: Theme;
    socials: Social[];
    settings: FolioSettings;
    is_published: boolean;
  };
  blocks: ExportedBlock[];
};

/** Build a portable export doc from a page + its blocks (strips ids/owner/timestamps). */
export function buildExport(
  page: FolioPage,
  blocks: FolioBlock[],
  exportedAt: number | null = null,
): FolioExport {
  const ordered = [...blocks].sort((a, b) => a.position - b.position);
  return {
    folio_export_version: FOLIO_EXPORT_VERSION,
    exported_at: exportedAt,
    page: {
      slug: page.slug,
      display_name: page.display_name,
      description: page.description,
      avatar_url: page.avatar_url,
      theme: page.theme,
      socials: page.socials,
      settings: page.settings,
      is_published: page.is_published,
    },
    blocks: ordered.map((b, i) => ({
      type: b.type,
      position: i,
      is_visible: b.is_visible,
      pinned: b.pinned,
      data: b.data,
    })),
  };
}

/** The page-settings portion an import applies (slug is intentionally excluded). */
export type ImportedPage = {
  display_name?: string;
  description?: string | null;
  avatar_url?: string | null;
  theme?: Theme;
  socials?: Social[];
  settings?: FolioSettings;
  is_published?: boolean;
};

export type ImportedBlock = {
  type: BlockType;
  data: BlockData;
  position: number;
  is_visible: boolean;
  pinned: boolean;
};

export type ParsedImport = {
  page: ImportedPage;
  blocks: ImportedBlock[];
  /** How many blocks in the source doc were dropped as invalid. */
  skipped: number;
};

export type ImportResult = ParsedImport | { error: string };

export function isImportError(r: ImportResult): r is { error: string } {
  return "error" in r;
}

/**
 * Validate + normalize a portable export doc into applyable settings + blocks.
 * Lenient on blocks (invalid ones are skipped and counted); the slug is never
 * applied (page identity stays put). Returns a Korean error on a malformed doc.
 */
export function parseImport(value: unknown, opts: { allowHttpLocal?: boolean } = {}): ImportResult {
  if (!value || typeof value !== "object") {
    return { error: "가져올 데이터 형식이 올바르지 않습니다" };
  }
  const doc = value as Record<string, unknown>;
  if (typeof doc.folio_export_version !== "number") {
    return { error: "Folio 내보내기 문서가 아닙니다 (folio_export_version 누락)" };
  }
  if (doc.folio_export_version > FOLIO_EXPORT_VERSION) {
    return { error: "더 높은 버전의 내보내기 문서는 가져올 수 없습니다" };
  }

  const srcPage =
    doc.page && typeof doc.page === "object" ? (doc.page as Record<string, unknown>) : {};
  const page: ImportedPage = {};
  if ("display_name" in srcPage) {
    page.display_name = sanitizeText(srcPage.display_name, "Folio", 80);
  }
  if ("description" in srcPage) {
    page.description = sanitizeText(srcPage.description, "", 240) || null;
  }
  if ("avatar_url" in srcPage) {
    page.avatar_url = normalizeUrl(srcPage.avatar_url, opts) ?? null;
  }
  if ("theme" in srcPage) page.theme = normalizeTheme(srcPage.theme);
  if ("socials" in srcPage) page.socials = normalizeSocials(srcPage.socials, opts);
  if ("settings" in srcPage) page.settings = normalizeSettings(srcPage.settings);
  if ("is_published" in srcPage) page.is_published = srcPage.is_published !== false;

  const srcBlocks = Array.isArray(doc.blocks) ? doc.blocks : [];
  const blocks: ImportedBlock[] = [];
  let skipped = 0;
  for (const raw of srcBlocks) {
    if (blocks.length >= MAX_BLOCKS) {
      skipped += 1;
      continue;
    }
    const entry = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const normalized = normalizeBlockData(entry.type, entry.data, opts);
    if ("error" in normalized) {
      skipped += 1;
      continue;
    }
    // Almanac short codes are deploy-specific — drop them so an imported link
    // re-registers (or runs standalone) on the destination deploy.
    if (normalized.type === "link") {
      delete (normalized.data as Record<string, unknown>).almanac_code;
    }
    blocks.push({
      type: normalized.type,
      data: normalized.data,
      position: blocks.length,
      is_visible: entry.is_visible !== false,
      pinned: entry.pinned === true,
    });
  }

  return { page, blocks, skipped };
}
