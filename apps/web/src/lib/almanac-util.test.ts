// SPDX-License-Identifier: MIT
import { describe, expect, test } from "bun:test";
import {
  almanacShortUrl,
  mintShortCode,
  parseAlmanacLink,
  parseAlmanacLinkStats,
  shortCodeOf,
} from "./almanac-util";

describe("almanac helpers", () => {
  test("almanacShortUrl builds {base}/{code}, trimming trailing slashes", () => {
    expect(almanacShortUrl("https://alm.example", "abc123")).toBe("https://alm.example/abc123");
    expect(almanacShortUrl("https://alm.example/", "abc123")).toBe("https://alm.example/abc123");
    expect(almanacShortUrl("https://alm.example//", "a b")).toBe("https://alm.example/a%20b");
  });

  test("mintShortCode is deterministic + always a valid Almanac short code", () => {
    const re = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
    const id = "9b1c2d3e-4f56-7890-abcd-ef1234567890";
    const code = mintShortCode(id);
    expect(code).toBe(mintShortCode(id)); // deterministic
    expect(re.test(code)).toBe(true);
    expect(code.startsWith("f")).toBe(true);
    // pathological input still yields a valid code
    expect(re.test(mintShortCode("!!!"))).toBe(true);
    expect(mintShortCode("a").length).toBeGreaterThanOrEqual(3);
  });

  test("parseAlmanacLink reads { shortCode, shortUrl }; derives URL when absent", () => {
    expect(
      parseAlmanacLink({ shortCode: "fxy", shortUrl: "https://alm/fxy" }, "https://alm"),
    ).toEqual({ code: "fxy", short_url: "https://alm/fxy" });
    expect(parseAlmanacLink({ shortCode: "fxy" }, "https://alm")).toEqual({
      code: "fxy",
      short_url: "https://alm/fxy",
    });
    expect(parseAlmanacLink({ no_code: true }, "https://alm")).toBeNull();
    expect(parseAlmanacLink(null, "https://alm")).toBeNull();
  });

  test("shortCodeOf reads the short_code of a /api/links row", () => {
    expect(shortCodeOf({ short_code: "fabc", clicks: 3 })).toBe("fabc");
    expect(shortCodeOf({})).toBeNull();
    expect(shortCodeOf(null)).toBeNull();
  });

  test("parseAlmanacLinkStats maps a link row (cents→dollars, lifetime clicks)", () => {
    expect(
      parseAlmanacLinkStats({
        total_clicks: 42,
        signups: 5,
        conversions: 2,
        revenue: 9800, // minor units (cents)
        first_revenue_at: 1700,
      }),
    ).toEqual({ clicks: 42, signups: 5, conversions: 2, revenue: 98, first_revenue_at: 1700 });
    expect(parseAlmanacLinkStats({})).toEqual({
      clicks: 0,
      signups: 0,
      conversions: 0,
      revenue: 0,
      first_revenue_at: null,
    });
    expect(parseAlmanacLinkStats({ total_clicks: "nope" }).clicks).toBe(0);
  });
});
