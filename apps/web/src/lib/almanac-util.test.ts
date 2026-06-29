// SPDX-License-Identifier: MIT
import { describe, expect, test } from "bun:test";
import type { LinkStatsRow } from "./almanac-contract";
import { almanacShortUrl, mintShortCode, toAlmanacStats } from "./almanac-util";

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
    expect(re.test(mintShortCode("!!!"))).toBe(true); // pathological input still valid
    expect(mintShortCode("a").length).toBeGreaterThanOrEqual(3);
  });

  test("toAlmanacStats maps a contract row (lifetime clicks, cents→dollars)", () => {
    const row: LinkStatsRow = {
      short_code: "fabc",
      short_url: "https://alm/fabc",
      target_url: "https://shop.test",
      target_host: "shop.test",
      campaign: "me",
      channel: "folio",
      created_at: 1,
      archived: 0,
      clicks: 3,
      total_clicks: 42,
      signups: 5,
      conversions: 2,
      revenue: 9800, // cents
      first_revenue_at: 1700,
    };
    expect(toAlmanacStats(row)).toEqual({
      clicks: 42,
      signups: 5,
      conversions: 2,
      revenue: 98,
      first_revenue_at: 1700,
    });
  });
});
