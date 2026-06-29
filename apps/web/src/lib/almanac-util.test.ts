// SPDX-License-Identifier: MIT
import { describe, expect, test } from "bun:test";
import { almanacShortUrl, parseAlmanacLink, parseAlmanacStats } from "./almanac-util";

describe("almanac helpers", () => {
  test("almanacShortUrl builds /l/<code>, trimming trailing slashes", () => {
    expect(almanacShortUrl("https://alm.example", "abc123")).toBe("https://alm.example/l/abc123");
    expect(almanacShortUrl("https://alm.example/", "abc123")).toBe("https://alm.example/l/abc123");
    expect(almanacShortUrl("https://alm.example//", "a b")).toBe("https://alm.example/l/a%20b");
  });

  test("parseAlmanacLink requires a code; derives short_url when absent", () => {
    expect(parseAlmanacLink({ code: "xy", short_url: "https://s/xy" }, "https://alm")).toEqual({
      code: "xy",
      short_url: "https://s/xy",
    });
    expect(parseAlmanacLink({ code: "xy", click_id: "c1" }, "https://alm")).toEqual({
      code: "xy",
      short_url: "https://alm/l/xy",
      click_id: "c1",
    });
    expect(parseAlmanacLink({ no_code: true }, "https://alm")).toBeNull();
    expect(parseAlmanacLink(null, "https://alm")).toBeNull();
  });

  test("parseAlmanacStats coerces missing/invalid fields to safe defaults", () => {
    expect(
      parseAlmanacStats({
        clicks: 12,
        signups: 3,
        conversions: 2,
        revenue: 49,
        first_revenue_at: 1,
      }),
    ).toEqual({ clicks: 12, signups: 3, conversions: 2, revenue: 49, first_revenue_at: 1 });
    expect(parseAlmanacStats({})).toEqual({
      clicks: 0,
      signups: 0,
      conversions: 0,
      revenue: 0,
      first_revenue_at: null,
    });
    expect(parseAlmanacStats({ clicks: "nope" }).clicks).toBe(0);
    expect(parseAlmanacStats(undefined).first_revenue_at).toBeNull();
  });
});
