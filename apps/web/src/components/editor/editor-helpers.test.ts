// SPDX-License-Identifier: MIT
import { describe, expect, test } from "bun:test";
import { BLOCK_TYPES, THEMES } from "@folio/core";
import { BLOCK_TYPE_OPTIONS, createDraftBlock, THEME_OPTIONS } from "./editor-helpers";

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
