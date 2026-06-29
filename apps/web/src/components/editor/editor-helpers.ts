import { BRANDS, BRAND_KEYS } from "@folio/buttons";
import type { BlockType } from "@folio/core";

export const BLOCK_TYPE_OPTIONS: Array<{ value: BlockType; label: string }> = [
  { value: "link", label: "링크" },
  { value: "heading", label: "헤딩" },
  { value: "text", label: "텍스트" },
  { value: "divider", label: "구분선" },
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
