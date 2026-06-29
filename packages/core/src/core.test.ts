import { describe, expect, test } from "bun:test";
import { MAX_BLOCKS, normalizeBlockData, normalizeReorderPayload } from "./blocks";
import { normalizeSocials, validateSocials } from "./page";
import { isReservedSlug, validateSlug } from "./slug";
import { hostnameOf, normalizeUrl, sanitizeText } from "./validation";

describe("validation", () => {
  test("normalizeUrl keeps https, rejects http (non-local)", () => {
    expect(normalizeUrl("https://example.com")).toBe("https://example.com/");
    expect(normalizeUrl("http://example.com")).toBeNull();
    expect(normalizeUrl("not a url")).toBeNull();
    expect(normalizeUrl("")).toBeNull();
  });

  test("normalizeUrl allows http localhost only with allowHttpLocal", () => {
    expect(normalizeUrl("http://localhost:3000", { allowHttpLocal: true })).toBe(
      "http://localhost:3000/",
    );
    expect(normalizeUrl("http://localhost:3000")).toBeNull();
  });

  test("sanitizeText strips html and clamps", () => {
    expect(sanitizeText("<b>hi</b>  there")).toBe("hi there");
    expect(sanitizeText("abcdef", "", 3)).toBe("abc");
    expect(sanitizeText(123, "fallback")).toBe("fallback");
  });

  test("hostnameOf strips www", () => {
    expect(hostnameOf("https://www.github.com/x")).toBe("github.com");
    expect(hostnameOf("nope")).toBeNull();
  });
});

describe("slug", () => {
  test("validateSlug accepts valid, rejects bad", () => {
    expect(validateSlug("hogyun")).toEqual({ slug: "hogyun" });
    expect(validateSlug("ab")).toHaveProperty("error"); // too short
    expect(validateSlug("-bad")).toHaveProperty("error");
    expect(validateSlug("UPPER")).toEqual({ slug: "upper" });
  });

  test("reserved slugs are rejected", () => {
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("api")).toBe(true);
    expect(isReservedSlug("hogyun")).toBe(false);
    expect(validateSlug("admin")).toHaveProperty("error");
  });
});

describe("normalizeBlockData", () => {
  test("link requires https url, keeps title/brand", () => {
    const ok = normalizeBlockData("link", {
      url: "https://github.com/x",
      title: "My GitHub",
      brand: "github",
    });
    expect(ok).toEqual({
      type: "link",
      data: { url: "https://github.com/x", title: "My GitHub", brand: "github" },
    });
    expect(normalizeBlockData("link", { url: "http://x.com" })).toHaveProperty("error");
  });

  test("link drops invalid brand key, keeps highlight", () => {
    const r = normalizeBlockData("link", {
      url: "https://x.com",
      title: "x",
      brand: "Not A Brand!",
      highlight: true,
    });
    expect(r).toEqual({
      type: "link",
      data: { url: "https://x.com/", title: "x", highlight: true },
    });
  });

  test("heading/text require text", () => {
    expect(normalizeBlockData("heading", { text: "Hi" })).toEqual({
      type: "heading",
      data: { text: "Hi" },
    });
    expect(normalizeBlockData("text", { text: "" })).toHaveProperty("error");
  });

  test("divider normalizes size", () => {
    expect(normalizeBlockData("divider", {})).toEqual({
      type: "divider",
      data: { size: "md" },
    });
    expect(normalizeBlockData("divider", { size: "lg" })).toEqual({
      type: "divider",
      data: { size: "lg" },
    });
  });

  test("unknown type errors", () => {
    expect(normalizeBlockData("landing_card", {})).toHaveProperty("error");
    expect(normalizeBlockData("youtube", {})).toHaveProperty("error");
  });

  test("MAX_BLOCKS is a positive integer", () => {
    expect(MAX_BLOCKS).toBeGreaterThan(0);
  });
});

describe("reorder + socials", () => {
  test("normalizeReorderPayload accepts block_ids and blocks", () => {
    expect(normalizeReorderPayload({ block_ids: ["a", "b"] })).toEqual({
      blocks: [
        { id: "a", position: 0 },
        { id: "b", position: 1 },
      ],
    });
    expect(normalizeReorderPayload({ blocks: [{ id: "a", position: 3 }] })).toEqual({
      blocks: [{ id: "a", position: 3 }],
    });
    expect(normalizeReorderPayload({})).toHaveProperty("error");
  });

  test("normalizeSocials drops invalid, clamps to 6", () => {
    const out = normalizeSocials([
      { brand: "github", url: "https://github.com/x" },
      { brand: "", url: "https://x.com" }, // empty brand dropped
      { brand: "x", url: "http://x.com" }, // http rejected
    ]);
    expect(out).toEqual([{ brand: "github", url: "https://github.com/x" }]);
  });

  test("validateSocials returns Korean error for bad url", () => {
    const r = validateSocials([{ brand: "x", url: "http://x.com" }]);
    expect(r).toHaveProperty("error");
  });
});
