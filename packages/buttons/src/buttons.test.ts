import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BRAND_KEYS, BRANDS } from "./brands.generated";
import { detectBrand, HOSTNAME_BRAND_MAP } from "./hostname-map";

const ICONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "icons");

describe("brand manifest extraction", () => {
  test("contains the canonical brands with correct icon/label", () => {
    expect(BRAND_KEYS.length).toBeGreaterThanOrEqual(80);
    expect(BRANDS.github).toMatchObject({ icon: "github", label: "GitHub" });
    expect(BRANDS.x).toMatchObject({ icon: "x", label: "X" });
    expect(BRANDS.yt).toMatchObject({ icon: "youtube", label: "YouTube" });
    expect(BRANDS.linked).toMatchObject({ icon: "linkedin", label: "LinkedIn" });
    expect(BRANDS.coffee).toMatchObject({ icon: "buy-me-a-coffee" });
  });

  test("every brand has a non-empty label and a background or class color", () => {
    for (const key of BRAND_KEYS) {
      const spec = BRANDS[key]!;
      expect(spec.brand).toBe(key);
      expect(spec.label.length).toBeGreaterThan(0);
      expect(spec.icon.length).toBeGreaterThan(0);
    }
  });

  test("every manifest icon resolves to an actual SVG file", () => {
    const missing = BRAND_KEYS.filter(
      (k) => !existsSync(join(ICONS_DIR, `${BRANDS[k]!.icon}.svg`)),
    );
    expect(missing).toEqual([]);
  });
});

describe("URL → brand auto-detect", () => {
  test("maps well-known hosts", () => {
    expect(detectBrand("https://github.com/october-academy")).toBe("github");
    expect(detectBrand("https://x.com/foo")).toBe("x");
    expect(detectBrand("https://twitter.com/foo")).toBe("x");
    expect(detectBrand("https://www.youtube.com/@foo")).toBe("yt");
    expect(detectBrand("https://youtu.be/abc")).toBe("yt");
    expect(detectBrand("https://www.linkedin.com/in/foo")).toBe("linked");
  });

  test("walks up subdomains", () => {
    expect(detectBrand("https://m.youtube.com/watch?v=x")).toBe("yt");
    expect(detectBrand("https://blog.medium.com/x")).toBe("medium");
  });

  test("returns undefined for unknown hosts and bad input", () => {
    expect(detectBrand("https://example.com")).toBeUndefined();
    expect(detectBrand("not a url")).toBeUndefined();
  });

  test("every hostname-map value is a real brand key", () => {
    for (const brand of Object.values(HOSTNAME_BRAND_MAP)) {
      expect(BRAND_KEYS).toContain(brand);
    }
  });
});
