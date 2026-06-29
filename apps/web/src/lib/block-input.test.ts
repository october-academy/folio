import { describe, expect, test } from "bun:test";
import { normalizeIncomingBlock } from "./block-input";

describe("normalizeIncomingBlock (URL→brand auto-detect)", () => {
  test("auto-detects brand from a known host", () => {
    const r = normalizeIncomingBlock("link", {
      url: "https://github.com/october-academy",
      title: "GH",
    });
    expect(r).toMatchObject({ type: "link", data: { brand: "github" } });
  });

  test("twitter.com maps to the x brand", () => {
    const r = normalizeIncomingBlock("link", { url: "https://twitter.com/foo" });
    expect(r).toMatchObject({ data: { brand: "x" } });
  });

  test("an explicit brand is respected over auto-detect", () => {
    const r = normalizeIncomingBlock("link", {
      url: "https://github.com/foo",
      title: "x",
      brand: "gitlab",
    });
    expect(r).toMatchObject({ data: { brand: "gitlab" } });
  });

  test("unknown hosts leave brand unset", () => {
    const r = normalizeIncomingBlock("link", {
      url: "https://example.com",
      title: "x",
    });
    expect(r).toEqual({
      type: "link",
      data: { url: "https://example.com/", title: "x" },
    });
  });

  test("non-link types pass straight through", () => {
    expect(normalizeIncomingBlock("heading", { text: "Hi" })).toEqual({
      type: "heading",
      data: { text: "Hi" },
    });
  });

  test("rejects http (non-local) urls", () => {
    expect(normalizeIncomingBlock("link", { url: "http://x.com" })).toHaveProperty("error");
  });
});
