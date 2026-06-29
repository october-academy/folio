// SPDX-License-Identifier: MIT
import { describe, expect, test } from "bun:test";
import { BLOCK_TYPES, THEMES } from "@folio/core";
import type { AlmanacStats } from "@/lib/almanac-util";
import {
  BLOCK_TYPE_OPTIONS,
  createDraftBlock,
  type EditorBlock,
  summarizeStats,
  THEME_OPTIONS,
} from "./editor-helpers";

describe("editor option ↔ core SSOT sync", () => {
  test("every block type has exactly one editor option", () => {
    const optionValues = BLOCK_TYPE_OPTIONS.map((o) => o.value).sort();
    expect(optionValues).toEqual([...BLOCK_TYPES].sort());
  });

  test("every theme option is a real core THEME", () => {
    const themeSet = new Set<string>(THEMES);
    for (const o of THEME_OPTIONS) expect(themeSet.has(o.value)).toBe(true);
    // and every core theme is offered in the editor
    const offered = new Set(THEME_OPTIONS.map((o) => o.value));
    for (const t of THEMES) expect(offered.has(t)).toBe(true);
  });

  test("createDraftBlock produces a draft for each block type", () => {
    for (const t of BLOCK_TYPES) {
      const draft = createDraftBlock(t);
      expect(draft.type).toBe(t);
      expect(draft.isDraft).toBe(true);
      expect(draft.id.startsWith("draft-")).toBe(true);
    }
  });
});

describe("summarizeStats", () => {
  const stat = (o: Partial<AlmanacStats>): AlmanacStats => ({
    clicks: 0,
    signups: 0,
    conversions: 0,
    revenue: 0,
    first_revenue_at: null,
    ...o,
  });
  const link = (id: string, title: string): EditorBlock => ({
    id,
    type: "link",
    position: 0,
    is_visible: true,
    data: { title, url: "https://x.com" },
  });

  test("aggregates only link blocks and ranks by revenue", () => {
    const blocks: EditorBlock[] = [
      link("a", "A"),
      link("b", "B"),
      { id: "h", type: "heading", position: 1, is_visible: true, data: { text: "x" } },
    ];
    const stats = {
      a: stat({ clicks: 10, conversions: 1, revenue: 5 }),
      b: stat({ clicks: 4, conversions: 3, revenue: 99 }),
      // heading + untracked link contribute nothing
    };
    const s = summarizeStats(blocks, stats);
    expect(s.trackedLinks).toBe(2);
    expect(s.totals).toEqual({ clicks: 14, signups: 0, conversions: 4, revenue: 104 });
    expect(s.rows.map((r) => r.id)).toEqual(["b", "a"]); // b ranks first (higher revenue)
  });

  test("empty when no link has stats", () => {
    const s = summarizeStats([link("a", "A")], {});
    expect(s.trackedLinks).toBe(0);
    expect(s.totals.clicks).toBe(0);
  });
});
