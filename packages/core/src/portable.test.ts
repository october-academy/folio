// SPDX-License-Identifier: MIT
import { describe, expect, test } from "bun:test";
import { buildExport, FOLIO_EXPORT_VERSION, isImportError, parseImport } from "./portable";
import type { FolioBlock, FolioPage } from "./types";

const page: FolioPage = {
  id: "page-1",
  slug: "hogyun",
  owner_id: "owner",
  display_name: "Hogyun",
  avatar_url: "https://img.test/a.png",
  description: "indie dev",
  socials: [{ brand: "github", url: "https://github.com/x" }],
  theme: "midnight",
  settings: { foo: "bar" },
  is_published: true,
  created_at: 1,
  updated_at: 2,
};

const blocks: FolioBlock[] = [
  {
    id: "b2",
    page_id: "page-1",
    type: "heading",
    position: 1,
    is_visible: true,
    pinned: false,
    data: { text: "Links" },
    created_at: 1,
    updated_at: 1,
  },
  {
    id: "b1",
    page_id: "page-1",
    type: "link",
    position: 0,
    is_visible: true,
    pinned: true,
    data: { url: "https://github.com/x", title: "GitHub", brand: "github", almanac_code: "ZZ" },
    created_at: 1,
    updated_at: 1,
  },
];

describe("buildExport", () => {
  test("produces an id-free, position-sorted doc", () => {
    const doc = buildExport(page, blocks, 999);
    expect(doc.folio_export_version).toBe(FOLIO_EXPORT_VERSION);
    expect(doc.exported_at).toBe(999);
    expect(doc.page).not.toHaveProperty("id");
    expect(doc.page).not.toHaveProperty("owner_id");
    expect(doc.page.slug).toBe("hogyun");
    // sorted by position → link (0) then heading (1), reindexed 0,1
    expect(doc.blocks.map((b) => b.type)).toEqual(["link", "heading"]);
    expect(doc.blocks.map((b) => b.position)).toEqual([0, 1]);
    expect(doc.blocks[0]).not.toHaveProperty("id");
  });
});

describe("parseImport", () => {
  test("rejects malformed / non-Folio / future docs", () => {
    expect(isImportError(parseImport(null))).toBe(true);
    expect(isImportError(parseImport({}))).toBe(true);
    expect(isImportError(parseImport({ folio_export_version: 999 }))).toBe(true);
  });

  test("roundtrips a built export, stripping deploy-specific almanac codes", () => {
    const doc = buildExport(page, blocks, 1);
    const parsed = parseImport(doc);
    if (isImportError(parsed)) throw new Error(parsed.error);
    expect(parsed.page.theme).toBe("midnight");
    expect(parsed.page.is_published).toBe(true);
    expect(parsed.page.socials).toEqual([{ brand: "github", url: "https://github.com/x" }]);
    expect(parsed.blocks.map((b) => b.type)).toEqual(["link", "heading"]);
    // almanac_code dropped on import
    const link = parsed.blocks.find((b) => b.type === "link");
    expect(link?.data).not.toHaveProperty("almanac_code");
    expect(link?.pinned).toBe(true);
  });

  test("skips invalid blocks and counts them", () => {
    const parsed = parseImport({
      folio_export_version: 1,
      page: {},
      blocks: [
        { type: "link", data: { url: "https://ok.com", title: "ok" } },
        { type: "link", data: { url: "not-a-url" } }, // invalid → skipped
        { type: "bogus", data: {} }, // unknown type → skipped
      ],
    });
    if (isImportError(parsed)) throw new Error(parsed.error);
    expect(parsed.blocks.length).toBe(1);
    expect(parsed.skipped).toBe(2);
  });
});
