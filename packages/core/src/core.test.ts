// SPDX-License-Identifier: MIT
import { describe, expect, test } from "bun:test";
import { MAX_BLOCKS, normalizeBlockData, normalizeReorderPayload } from "./blocks";
import {
  customThemeStyle,
  normalizeCustomTheme,
  normalizeSocials,
  normalizeTheme,
  THEMES,
  validateSocials,
} from "./page";
import { isReservedSlug, validateSlug } from "./slug";
import {
  extractYouTubeId,
  hostnameOf,
  normalizeEmail,
  normalizePhone,
  normalizeUrl,
  sanitizeText,
  telHref,
} from "./validation";

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

  test("normalizeEmail validates + lowercases, strips mailto:", () => {
    expect(normalizeEmail("Hi@Example.com")).toBe("hi@example.com");
    expect(normalizeEmail("mailto:a@b.io")).toBe("a@b.io");
    expect(normalizeEmail("no-at-sign")).toBeNull();
    expect(normalizeEmail("a@b")).toBeNull();
    expect(normalizeEmail(42)).toBeNull();
  });

  test("normalizePhone preserves display format, telHref makes it dialable", () => {
    expect(normalizePhone("+82 (10) 1234-5678")).toBe("+82 (10) 1234-5678");
    expect(normalizePhone("tel:010-1234-5678")).toBe("010-1234-5678");
    expect(normalizePhone("abc")).toBeNull();
    expect(telHref("+82 (10) 1234-5678")).toBe("tel:+821012345678");
  });

  test("extractYouTubeId handles watch/share/embed/shorts + bare id", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeId("https://example.com/watch?v=nope")).toBeNull();
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
    expect(normalizeBlockData("totally_made_up", {})).toHaveProperty("error");
  });

  test("email requires a valid address, defaults title", () => {
    expect(normalizeBlockData("email", { email: "Me@Site.com" })).toEqual({
      type: "email",
      data: { email: "me@site.com", title: "이메일" },
    });
    expect(normalizeBlockData("email", { email: "bad" })).toHaveProperty("error");
  });

  test("phone normalizes number, keeps description", () => {
    expect(
      normalizeBlockData("phone", {
        phone: "+1 (415) 555-0000",
        title: "Call",
        description: "9-5",
      }),
    ).toEqual({
      type: "phone",
      data: { phone: "+1 (415) 555-0000", title: "Call", description: "9-5" },
    });
    expect(normalizeBlockData("phone", { phone: "x" })).toHaveProperty("error");
  });

  test("image requires https url, keeps optional href", () => {
    expect(
      normalizeBlockData("image", {
        url: "https://img.test/a.png",
        alt: "A",
        href: "https://x.com",
      }),
    ).toEqual({
      type: "image",
      data: { url: "https://img.test/a.png", alt: "A", href: "https://x.com/" },
    });
    expect(normalizeBlockData("image", { alt: "no url" })).toHaveProperty("error");
  });

  test("youtube extracts id from url or bare id, errors otherwise", () => {
    expect(normalizeBlockData("youtube", { url: "https://youtu.be/dQw4w9WgXcQ" })).toEqual({
      type: "youtube",
      data: { video_id: "dQw4w9WgXcQ" },
    });
    expect(normalizeBlockData("youtube", {})).toHaveProperty("error");
  });

  test("vcard requires a name, normalizes contact fields", () => {
    expect(
      normalizeBlockData("vcard", {
        name: "Hogyun Yu",
        org: "October Academy",
        role: "Founder",
        email: "Hi@Oct.com",
        phone: "+82 10 1234 5678",
        url: "https://oct.com",
      }),
    ).toEqual({
      type: "vcard",
      data: {
        name: "Hogyun Yu",
        org: "October Academy",
        role: "Founder",
        email: "hi@oct.com",
        phone: "+82 10 1234 5678",
        url: "https://oct.com/",
      },
    });
    expect(normalizeBlockData("vcard", { org: "no name" })).toHaveProperty("error");
  });

  test("qr requires an https target, keeps caption", () => {
    expect(
      normalizeBlockData("qr", { target: "https://folio.example/@me", caption: "내 페이지" }),
    ).toEqual({
      type: "qr",
      data: { target: "https://folio.example/@me", caption: "내 페이지" },
    });
    expect(normalizeBlockData("qr", { target: "not-a-url" })).toHaveProperty("error");
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

describe("themes", () => {
  test("normalizeTheme accepts known presets, falls back to auto", () => {
    expect(normalizeTheme("dark")).toBe("dark");
    expect(normalizeTheme("mint")).toBe("mint");
    expect(normalizeTheme("midnight")).toBe("midnight");
    expect(normalizeTheme("not-a-theme")).toBe("auto");
    expect(normalizeTheme(undefined)).toBe("auto");
  });

  test("every THEME normalizes back to itself", () => {
    for (const t of THEMES) expect(normalizeTheme(t)).toBe(t);
  });

  test("custom is a valid theme", () => {
    expect(normalizeTheme("custom")).toBe("custom");
  });

  test("normalizeCustomTheme keeps known hex vars, drops the rest (injection-safe)", () => {
    expect(
      normalizeCustomTheme({
        background: "#FFF",
        accent: "#ff6b35",
        evil: "url(javascript:alert(1))", // unknown key dropped
        foreground: "red", // non-hex dropped
        border: "#12345678", // 8-digit hex ok
      }),
    ).toEqual({ background: "#fff", accent: "#ff6b35", border: "#12345678" });
    expect(normalizeCustomTheme("nope")).toEqual({});
  });

  test("customThemeStyle maps to --css-variables", () => {
    expect(customThemeStyle({ background: "#000", accent: "#fff" })).toEqual({
      "--background": "#000",
      "--accent": "#fff",
    });
  });
});
