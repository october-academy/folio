// SPDX-License-Identifier: MIT
import { describe, expect, test } from "bun:test";
import { faviconProxyUrl, faviconUpstreamUrl, validHost } from "./favicon-util";

describe("favicon helpers", () => {
  test("validHost accepts real hostnames, rejects junk", () => {
    expect(validHost("example.com")).toBe(true);
    expect(validHost("sub.example.co.uk")).toBe(true);
    expect(validHost("localhost")).toBe(false); // no dot
    expect(validHost(".com")).toBe(false);
    expect(validHost("has space.com")).toBe(false);
    expect(validHost("UPPER.com")).toBe(false); // expects lowercased input
  });

  test("faviconUpstreamUrl targets the Google s2 service at 64px", () => {
    const u = faviconUpstreamUrl("example.com");
    expect(u).toContain("https://www.google.com/s2/favicons");
    expect(u).toContain("domain=example.com");
    expect(u).toContain("sz=64");
  });

  test("faviconProxyUrl encodes the link url into the proxy route", () => {
    expect(faviconProxyUrl("https://news.ycombinator.com/item?id=1")).toBe(
      "/api/favicon?u=https%3A%2F%2Fnews.ycombinator.com%2Fitem%3Fid%3D1",
    );
  });
});
