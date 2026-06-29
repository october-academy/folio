// SPDX-License-Identifier: MIT
import { describe, expect, test } from "bun:test";
import { qrModules, qrSvgPath } from "./qr";

describe("qr encoding", () => {
  const m = qrModules("https://folio.example/@me", "M");
  const n = m.length;

  test("produces an odd, >=21 square matrix", () => {
    expect(n).toBeGreaterThanOrEqual(21);
    expect(n % 2).toBe(1);
    expect(m.every((row) => row.length === n)).toBe(true);
  });

  test("has the three mandatory finder patterns (mask-independent)", () => {
    // Top-left finder: dark 7x7 ring with a 3x3 dark center, white inner ring.
    expect(m[0]?.[0]).toBe(true);
    expect(m[0]?.[6]).toBe(true);
    expect(m[6]?.[0]).toBe(true);
    expect(m[6]?.[6]).toBe(true);
    expect(m[1]?.[1]).toBe(false); // white ring
    expect(m[3]?.[3]).toBe(true); // dark center
    // Top-right finder.
    expect(m[0]?.[n - 1]).toBe(true);
    expect(m[0]?.[n - 7]).toBe(true);
    // Bottom-left finder.
    expect(m[n - 1]?.[0]).toBe(true);
    expect(m[n - 7]?.[0]).toBe(true);
  });

  test("has a separator (white) around the top-left finder", () => {
    expect(m[7]?.[0]).toBe(false);
    expect(m[0]?.[7]).toBe(false);
  });

  test("longer payloads select a larger version", () => {
    const big = qrModules(`https://folio.example/${"x".repeat(300)}`, "M");
    expect(big.length).toBeGreaterThan(n);
  });

  test("svg path covers dark modules and is non-empty", () => {
    const path = qrSvgPath(m);
    expect(path.length).toBeGreaterThan(0);
    expect(path.startsWith("M")).toBe(true);
    // No dark modules → empty path.
    expect(
      qrSvgPath([
        [false, false],
        [false, false],
      ]),
    ).toBe("");
  });
});
