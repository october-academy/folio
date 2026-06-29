// SPDX-License-Identifier: MIT
import { BRAND_KEYS, BRANDS } from "@folio/buttons";
import type { BlockType } from "@folio/core";
import type { AlmanacStats } from "@/lib/almanac-util";

/** Theme presets surfaced in the editor (value must be in @folio/core THEMES). */
export const THEME_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "auto", label: "자동 (시스템)" },
  { value: "light", label: "라이트" },
  { value: "dark", label: "다크" },
  { value: "mint", label: "민트" },
  { value: "grape", label: "그레이프" },
  { value: "sunset", label: "선셋" },
  { value: "midnight", label: "미드나잇" },
  { value: "custom", label: "커스텀" },
];

/** Korean labels + starting hex for the custom-theme color editor. */
export const CUSTOM_THEME_FIELDS: Array<{ var: string; label: string; fallback: string }> = [
  { var: "background", label: "배경", fallback: "#ffffff" },
  { var: "foreground", label: "글자", fallback: "#0a0a0a" },
  { var: "secondary", label: "보조 배경", fallback: "#f5f5f5" },
  { var: "muted", label: "흐린 배경", fallback: "#e5e5e5" },
  { var: "muted-foreground", label: "흐린 글자", fallback: "#737373" },
  { var: "border", label: "테두리", fallback: "#e5e5e5" },
  { var: "accent", label: "강조", fallback: "#ff6b35" },
  { var: "accent-foreground", label: "강조 글자", fallback: "#ffffff" },
  { var: "accent-text", label: "강조 텍스트", fallback: "#e85a28" },
];

export const BLOCK_TYPE_OPTIONS: Array<{ value: BlockType; label: string }> = [
  { value: "link", label: "링크" },
  { value: "heading", label: "헤딩" },
  { value: "text", label: "텍스트" },
  { value: "divider", label: "구분선" },
  { value: "email", label: "이메일" },
  { value: "phone", label: "전화" },
  { value: "image", label: "이미지" },
  { value: "youtube", label: "YouTube" },
  { value: "vcard", label: "연락처(vCard)" },
  { value: "qr", label: "QR 코드" },
];

/** All brands, sorted by label, for the social/link brand pickers. */
export const BRAND_OPTIONS: Array<{ value: string; label: string }> = BRAND_KEYS.map((key) => ({
  value: key,
  label: BRANDS[key]?.label ?? key,
})).sort((a, b) => a.label.localeCompare(b.label));

export type EditorBlock = {
  id: string;
  type: BlockType;
  position: number;
  is_visible: boolean;
  data: Record<string, unknown>;
  isDraft?: boolean;
};

export type SocialDraft = { brand: string; url: string };

export function createDraftBlock(type: BlockType): EditorBlock {
  const base = {
    id: `draft-${crypto.randomUUID()}`,
    position: 0,
    is_visible: true,
    type,
    isDraft: true,
  };
  switch (type) {
    case "link":
      return {
        ...base,
        data: { url: "https://", title: "", brand: "", description: "", highlight: false },
      };
    case "heading":
      return { ...base, data: { text: "" } };
    case "text":
      return { ...base, data: { text: "" } };
    case "email":
      return { ...base, data: { email: "", title: "", description: "" } };
    case "phone":
      return { ...base, data: { phone: "", title: "", description: "" } };
    case "image":
      return { ...base, data: { url: "https://", alt: "", href: "" } };
    case "youtube":
      return { ...base, data: { video_id: "", title: "" } };
    case "vcard":
      return {
        ...base,
        data: { name: "", label: "", org: "", role: "", email: "", phone: "", url: "" },
      };
    case "qr":
      return { ...base, data: { target: "https://", caption: "" } };
    default:
      return { ...base, data: { size: "md" } };
  }
}

/** Move `fromId` to `toId`'s position and renumber. Pure. */
export function reorderBlocks(blocks: EditorBlock[], fromId: string, toId: string): EditorBlock[] {
  const next = [...blocks];
  const fromIndex = next.findIndex((b) => b.id === fromId);
  const toIndex = next.findIndex((b) => b.id === toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return blocks;
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return blocks;
  next.splice(toIndex, 0, moved);
  return next.map((b, index) => ({ ...b, position: index }));
}

export function blockTypeLabel(type: BlockType): string {
  return BLOCK_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

// --- Almanac analytics aggregation (pure) -----------------------------------

export type LinkStatRow = { id: string; title: string; stats: AlmanacStats };
export type StatsSummary = {
  totals: { clicks: number; signups: number; conversions: number; revenue: number };
  rows: LinkStatRow[];
  trackedLinks: number;
};

/**
 * Aggregate per-link Almanac stats across the editor's link blocks into totals
 * plus a table ranked by revenue → conversions → clicks. Pure + testable.
 */
export function summarizeStats(
  blocks: EditorBlock[],
  stats: Record<string, AlmanacStats>,
): StatsSummary {
  const rows: LinkStatRow[] = [];
  const totals = { clicks: 0, signups: 0, conversions: 0, revenue: 0 };

  for (const b of blocks) {
    if (b.type !== "link") continue;
    const stat = stats[b.id];
    if (!stat) continue;
    const title = String(b.data.title || b.data.url || "링크");
    rows.push({ id: b.id, title, stats: stat });
    totals.clicks += stat.clicks;
    totals.signups += stat.signups;
    totals.conversions += stat.conversions;
    totals.revenue += stat.revenue;
  }

  rows.sort(
    (a, b) =>
      b.stats.revenue - a.stats.revenue ||
      b.stats.conversions - a.stats.conversions ||
      b.stats.clicks - a.stats.clicks,
  );

  return { totals, rows, trackedLinks: rows.length };
}
