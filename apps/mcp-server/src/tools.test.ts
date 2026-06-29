// SPDX-License-Identifier: MIT
import { describe, expect, test } from "bun:test";
import { BLOCK_TYPES, THEMES } from "@folio/core";
import { isPlanError, planRequest, TOOL_DEFINITIONS, TOOL_NAMES } from "./tools.js";

describe("tool definitions", () => {
  test("exposes the three Folio tools with object schemas", () => {
    expect(TOOL_NAMES).toEqual(["get_folio", "update_folio", "manage_blocks"]);
    for (const t of TOOL_DEFINITIONS) expect(t.inputSchema.type).toBe("object");
  });

  test("schemas advertise the core THEMES and BLOCK_TYPES (SSOT)", () => {
    const update = TOOL_DEFINITIONS.find((t) => t.name === "update_folio");
    const themeEnum = (update?.inputSchema.properties.theme as { enum: string[] }).enum;
    expect(themeEnum).toEqual([...THEMES]);
    const manage = TOOL_DEFINITIONS.find((t) => t.name === "manage_blocks");
    const typeEnum = (manage?.inputSchema.properties.type as { enum: string[] }).enum;
    expect(typeEnum).toEqual([...BLOCK_TYPES]);
  });
});

describe("planRequest — get_folio", () => {
  test("plans a GET", () => {
    expect(planRequest("get_folio", {})).toEqual({
      calls: [{ method: "GET", path: "/api/folio" }],
      summary: "read folio",
    });
  });
});

describe("planRequest — update_folio", () => {
  test("settings-only update", () => {
    const r = planRequest("update_folio", { display_name: "Hogyun", theme: "midnight" });
    expect(r).toEqual({
      calls: [
        {
          method: "PUT",
          path: "/api/folio/settings",
          body: { display_name: "Hogyun", theme: "midnight" },
        },
      ],
      summary: "update folio (1 call(s))",
    });
  });

  test("slug-only update", () => {
    const r = planRequest("update_folio", { slug: "hogyun" });
    expect(isPlanError(r)).toBe(false);
    if (!isPlanError(r)) {
      expect(r.calls).toEqual([
        { method: "PUT", path: "/api/folio/slug", body: { slug: "hogyun" } },
      ]);
    }
  });

  test("settings + slug → two ordered calls", () => {
    const r = planRequest("update_folio", { description: "hi", slug: "me" });
    if (isPlanError(r)) throw new Error("unexpected error");
    expect(r.calls.map((c) => c.path)).toEqual(["/api/folio/settings", "/api/folio/slug"]);
  });

  test("socials must be an array; empty update errors", () => {
    expect(isPlanError(planRequest("update_folio", { socials: "nope" }))).toBe(true);
    expect(isPlanError(planRequest("update_folio", {}))).toBe(true);
    expect(isPlanError(planRequest("update_folio", { slug: "" }))).toBe(true);
  });
});

describe("planRequest — manage_blocks", () => {
  test("create requires type, passes data through", () => {
    const r = planRequest("manage_blocks", {
      action: "create",
      type: "link",
      data: { url: "https://x.com", title: "X" },
    });
    expect(r).toEqual({
      calls: [
        {
          method: "POST",
          path: "/api/folio/blocks",
          body: { type: "link", data: { url: "https://x.com", title: "X" } },
        },
      ],
      summary: "create block",
    });
    expect(isPlanError(planRequest("manage_blocks", { action: "create" }))).toBe(true);
  });

  test("update targets the block id, needs at least one field", () => {
    const r = planRequest("manage_blocks", { action: "update", id: "abc", data: { title: "Y" } });
    if (isPlanError(r)) throw new Error("unexpected");
    expect(r.calls[0]?.path).toBe("/api/folio/blocks/abc");
    expect(r.calls[0]?.method).toBe("PUT");
    expect(isPlanError(planRequest("manage_blocks", { action: "update", id: "abc" }))).toBe(true);
    expect(isPlanError(planRequest("manage_blocks", { action: "update" }))).toBe(true);
  });

  test("delete + reorder", () => {
    expect(planRequest("manage_blocks", { action: "delete", id: "x1" })).toEqual({
      calls: [{ method: "DELETE", path: "/api/folio/blocks/x1" }],
      summary: "delete block",
    });
    expect(planRequest("manage_blocks", { action: "reorder", block_ids: ["b", "a"] })).toEqual({
      calls: [
        { method: "PUT", path: "/api/folio/blocks/reorder", body: { block_ids: ["b", "a"] } },
      ],
      summary: "reorder blocks",
    });
    expect(isPlanError(planRequest("manage_blocks", { action: "reorder", block_ids: [] }))).toBe(
      true,
    );
    expect(isPlanError(planRequest("manage_blocks", { action: "frobnicate" }))).toBe(true);
  });
});

describe("planRequest — unknown tool", () => {
  test("errors", () => {
    expect(isPlanError(planRequest("nope", {}))).toBe(true);
  });
});
