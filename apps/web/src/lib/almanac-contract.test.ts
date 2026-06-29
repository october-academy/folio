// SPDX-License-Identifier: MIT
import { describe, expect, test } from "bun:test";
import {
  linkCreateRequestSchema,
  linkCreateResponseSchema,
  linkStatsRowSchema,
  linksResponseSchema,
} from "./almanac-contract";

const validRow = {
  short_code: "fabc",
  short_url: "https://alm/fabc",
  target_url: "https://shop.test/buy",
  target_host: "shop.test",
  campaign: "me",
  channel: "folio",
  created_at: 1,
  archived: 0,
  clicks: 3,
  total_clicks: 42,
  signups: 5,
  conversions: 2,
  revenue: 9800,
  first_revenue_at: 1700,
};

describe("almanac contract (zod)", () => {
  test("link create request enforces shortCode 3–30 + a valid targetUrl", () => {
    expect(
      linkCreateRequestSchema.safeParse({
        shortCode: "fabc",
        targetUrl: "https://shop.test/buy",
        channel: "folio",
      }).success,
    ).toBe(true);
    expect(
      linkCreateRequestSchema.safeParse({ shortCode: "ab", targetUrl: "https://x.io" }).success,
    ).toBe(false);
    expect(
      linkCreateRequestSchema.safeParse({ shortCode: "fabc", targetUrl: "not-a-url" }).success,
    ).toBe(false);
  });

  test("link create response requires shortUrl + shortCode", () => {
    expect(
      linkCreateResponseSchema.safeParse({ shortUrl: "https://alm/fabc", shortCode: "fabc" })
        .success,
    ).toBe(true);
    expect(linkCreateResponseSchema.safeParse({ shortCode: "fabc" }).success).toBe(false);
  });

  test("link stats row + links response parse a conforming payload", () => {
    expect(linkStatsRowSchema.safeParse(validRow).success).toBe(true);
    expect(linksResponseSchema.safeParse({ range: "90d", links: [validRow] }).success).toBe(true);
    // a row missing the rollup fields (older Almanac) does not conform
    const { total_clicks, ...partial } = validRow;
    void total_clicks;
    expect(linkStatsRowSchema.safeParse(partial).success).toBe(false);
    // an invalid range is rejected
    expect(linksResponseSchema.safeParse({ range: "weekly", links: [] }).success).toBe(false);
  });
});
