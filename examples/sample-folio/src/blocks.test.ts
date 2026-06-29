// SPDX-License-Identifier: MIT
import { describe, expect, test } from "bun:test";
import { buildSampleBlocks } from "./blocks";

describe("sample Folio (URL → brand auto-detect proof)", () => {
  const blocks = buildSampleBlocks();
  const links = blocks.filter((b) => b.type === "link");

  test("known hosts auto-assign the right LittleLink brand", () => {
    const brandOf = (needle: string) =>
      (
        links.find((b) => (b.data as { url: string }).url.includes(needle))?.data as {
          brand?: string;
        }
      )?.brand;

    expect(brandOf("github.com")).toBe("github");
    expect(brandOf("x.com")).toBe("x");
    expect(brandOf("youtube.com")).toBe("yt");
    expect(brandOf("discord.gg")).toBe("discord");
    expect(brandOf("buymeacoffee.com")).toBe("coffee");
  });

  test("unknown hosts get no brand (renderer falls back to favicon/generic)", () => {
    const blog = links.find((b) => (b.data as { url: string }).url.includes("example.com"));
    expect((blog?.data as { brand?: string }).brand).toBeUndefined();
  });

  test("structural blocks are included", () => {
    expect(blocks.some((b) => b.type === "heading")).toBe(true);
    expect(blocks.some((b) => b.type === "divider")).toBe(true);
    expect(blocks.some((b) => b.type === "text")).toBe(true);
  });
});
