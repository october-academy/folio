/**
 * Block taxonomy — the single source of truth for Folio's typed blocks.
 *
 * v0.1 ships four blocks: link, heading, text, divider. Each block's `data`
 * is type-specific (clean-room learned from LinkStack's type + type_params).
 * v0.2 will add email/phone/vcard/youtube/qr/image (SPEC §6).
 */
import { z } from "zod";
import { normalizeUrl, sanitizeText } from "./validation.js";

export const BLOCK_TYPES = ["link", "heading", "text", "divider"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];
export const BLOCK_TYPE_SET: ReadonlySet<string> = new Set(BLOCK_TYPES);

/** Max blocks per page (link-in-bio pages are link-heavy; original bio capped at 10). */
export const MAX_BLOCKS = 50;

/** A LittleLink brand key, e.g. "github", "x", "buy-me-a-coffee". */
export const BRAND_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,40}$/;

// --- Per-type data shapes ---------------------------------------------------

export type LinkBlockData = {
  url: string;
  title: string;
  /** LittleLink brand key (auto-detected upstream or chosen); renderer falls back to favicon. */
  brand?: string;
  /** Cached favicon URL for unknown hosts (v0.2 fetch). */
  favicon_url?: string;
  description?: string;
  highlight?: boolean;
  /** Almanac short code when Almanac integration is on (v0.2). */
  almanac_code?: string;
};
export type HeadingBlockData = { text: string };
export type TextBlockData = { text: string };
export type DividerBlockData = { size?: "sm" | "md" | "lg" };

export type BlockData =
  | LinkBlockData
  | HeadingBlockData
  | TextBlockData
  | DividerBlockData;

// --- zod schemas (structural; for MCP/external validation & type inference) --

const brandKeySchema = z.string().regex(BRAND_KEY_PATTERN);

export const linkDataSchema = z.object({
  url: z.string(),
  title: z.string(),
  brand: brandKeySchema.optional(),
  favicon_url: z.string().optional(),
  description: z.string().optional(),
  highlight: z.boolean().optional(),
  almanac_code: z.string().optional(),
});
export const headingDataSchema = z.object({ text: z.string() });
export const textDataSchema = z.object({ text: z.string() });
export const dividerDataSchema = z.object({
  size: z.enum(["sm", "md", "lg"]).optional(),
});

// --- Runtime normalization (the path API routes use) ------------------------

export type NormalizedBlock = { type: BlockType; data: BlockData };
export type NormalizeResult = NormalizedBlock | { error: string };

export function isNormalizeError(
  result: NormalizeResult,
): result is { error: string } {
  return "error" in result;
}

/**
 * Validate + normalize a block's (type, data). Mirrors the Agentic30
 * normalizeBlockPayload but for Folio's taxonomy, with no storage coupling.
 * Brand auto-detection happens upstream (in @folio/buttons); here `brand` is
 * accepted only if it is a well-formed key.
 */
export function normalizeBlockData(
  type: unknown,
  data: unknown,
  opts: { allowHttpLocal?: boolean } = {},
): NormalizeResult {
  if (typeof type !== "string" || !BLOCK_TYPE_SET.has(type)) {
    return { error: "지원하지 않는 블록 타입입니다" };
  }
  const blockType = type as BlockType;
  const source =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  if (blockType === "divider") {
    const size = source.size;
    return {
      type: blockType,
      data: { size: size === "sm" || size === "lg" ? size : "md" },
    };
  }

  if (blockType === "heading") {
    const text = sanitizeText(source.text, "", 120);
    if (!text) return { error: "헤딩 텍스트가 필요합니다" };
    return { type: blockType, data: { text } };
  }

  if (blockType === "text") {
    const text = sanitizeText(source.text, "", 600);
    if (!text) return { error: "텍스트 블록 내용이 필요합니다" };
    return { type: blockType, data: { text } };
  }

  // link
  const url = normalizeUrl(source.url, { allowHttpLocal: opts.allowHttpLocal });
  if (!url) return { error: "https:// 링크만 사용할 수 있습니다" };

  const brand =
    typeof source.brand === "string" && BRAND_KEY_PATTERN.test(source.brand)
      ? source.brand
      : undefined;
  const faviconUrl =
    typeof source.favicon_url === "string"
      ? (normalizeUrl(source.favicon_url, { allowHttpLocal: opts.allowHttpLocal }) ??
        undefined)
      : undefined;
  const description = sanitizeText(source.description, "", 200) || undefined;
  const almanacCode =
    typeof source.almanac_code === "string" && source.almanac_code
      ? source.almanac_code
      : undefined;

  const linkData: LinkBlockData = {
    url,
    title: sanitizeText(source.title, "링크", 100),
    ...(brand ? { brand } : {}),
    ...(faviconUrl ? { favicon_url: faviconUrl } : {}),
    ...(description ? { description } : {}),
    ...(source.highlight === true ? { highlight: true } : {}),
    ...(almanacCode ? { almanac_code: almanacCode } : {}),
  };
  return { type: blockType, data: linkData };
}

/**
 * Normalize a reorder payload into [{ id, position }]. Accepts either
 * `block_ids: string[]` (order = index) or `blocks: [{ id, position }]`.
 */
export function normalizeReorderPayload(
  value: unknown,
): { blocks: Array<{ id: string; position: number }> } | { error: string } {
  if (!value || typeof value !== "object") {
    return { error: "정렬할 블록이 필요합니다" };
  }
  const body = value as { block_ids?: unknown; blocks?: unknown };

  if (Array.isArray(body.block_ids)) {
    if (body.block_ids.length === 0) return { error: "정렬할 블록이 필요합니다" };
    const ids = body.block_ids
      .map((entry) => sanitizeText(entry, "", 64))
      .filter(Boolean);
    if (ids.length !== body.block_ids.length) {
      return { error: "정렬할 블록이 필요합니다" };
    }
    return { blocks: ids.map((id, index) => ({ id, position: index })) };
  }

  if (Array.isArray(body.blocks) && body.blocks.length > 0) {
    const blocks = body.blocks.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const id = sanitizeText((entry as Record<string, unknown>).id, "", 64);
      const position = (entry as Record<string, unknown>).position;
      if (!id || typeof position !== "number" || position < 0) return [];
      return [{ id, position }];
    });
    if (blocks.length !== body.blocks.length) {
      return { error: "정렬할 블록이 필요합니다" };
    }
    return { blocks };
  }

  return { error: "정렬할 블록이 필요합니다" };
}
