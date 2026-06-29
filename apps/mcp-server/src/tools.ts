// SPDX-License-Identifier: MIT
/**
 * Folio MCP tool definitions and request planning. Pure (no network) so the
 * input → HTTP-request mapping is unit-testable. The server (`index.ts`) wires
 * these to the SDK; the client (`client.ts`) executes the planned calls against
 * the authenticated Folio HTTP API — keeping all validation in one place (the
 * API), exactly as the editor uses it.
 */
import { BLOCK_TYPES, THEMES } from "@folio/core";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
export type RequestCall = { method: HttpMethod; path: string; body?: unknown };
export type Plan = { calls: RequestCall[]; summary: string };
export type PlanResult = Plan | { error: string };

export function isPlanError(r: PlanResult): r is { error: string } {
  return "error" in r;
}

type JsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};
export type ToolDefinition = { name: string; description: string; inputSchema: JsonSchema };

/** JSON-Schema tool definitions advertised to MCP clients. */
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "get_folio",
    description:
      "Read the current Folio: page settings (slug, display name, theme, socials) and all blocks.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "update_folio",
    description:
      "Update Folio page settings and/or slug. Only the provided fields change. Use for display name, description, avatar, theme, socials, publish state, and slug.",
    inputSchema: {
      type: "object",
      properties: {
        display_name: { type: "string" },
        description: { type: "string" },
        avatar_url: { type: "string", description: "https:// URL or empty string to clear" },
        theme: { type: "string", enum: [...THEMES] },
        is_published: { type: "boolean" },
        socials: {
          type: "array",
          maxItems: 6,
          items: {
            type: "object",
            properties: { brand: { type: "string" }, url: { type: "string" } },
            required: ["brand", "url"],
            additionalProperties: false,
          },
        },
        slug: { type: "string", description: "The /@slug handle (a–z, 0–9, hyphen)" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "manage_blocks",
    description:
      "Create, update, delete, or reorder Folio blocks. action=create needs `type` (+ `data`); update/delete need `id`; reorder needs `block_ids` (the full ordered list).",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["create", "update", "delete", "reorder"] },
        id: { type: "string", description: "block id (update/delete)" },
        type: { type: "string", enum: [...BLOCK_TYPES], description: "block type (create/update)" },
        data: { type: "object", description: "type-specific block data (create/update)" },
        position: { type: "number" },
        is_visible: { type: "boolean" },
        block_ids: {
          type: "array",
          items: { type: "string" },
          description: "full ordered list of block ids (reorder)",
        },
      },
      required: ["action"],
      additionalProperties: false,
    },
  },
];

export const TOOL_NAMES = TOOL_DEFINITIONS.map((t) => t.name);

// --- helpers ---------------------------------------------------------------

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function str(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

// --- planners --------------------------------------------------------------

function planUpdateFolio(args: Record<string, unknown>): PlanResult {
  const calls: RequestCall[] = [];

  const settings: Record<string, unknown> = {};
  for (const key of ["display_name", "description", "avatar_url", "theme", "is_published"]) {
    if (key in args) settings[key] = args[key];
  }
  if ("socials" in args) {
    if (!Array.isArray(args.socials)) return { error: "socials must be an array" };
    settings.socials = args.socials;
  }
  if (Object.keys(settings).length > 0) {
    calls.push({ method: "PUT", path: "/api/folio/settings", body: settings });
  }

  if ("slug" in args) {
    const slug = str(args.slug);
    if (!slug) return { error: "slug must be a non-empty string" };
    calls.push({ method: "PUT", path: "/api/folio/slug", body: { slug } });
  }

  if (calls.length === 0) return { error: "Nothing to update — provide at least one field." };
  return { calls, summary: `update folio (${calls.length} call(s))` };
}

function planManageBlocks(args: Record<string, unknown>): PlanResult {
  const action = str(args.action);
  switch (action) {
    case "create": {
      const type = str(args.type);
      if (!type) return { error: "create requires `type`" };
      const body: Record<string, unknown> = { type, data: asObject(args.data) };
      if ("position" in args) body.position = args.position;
      if ("is_visible" in args) body.is_visible = args.is_visible;
      return {
        calls: [{ method: "POST", path: "/api/folio/blocks", body }],
        summary: "create block",
      };
    }
    case "update": {
      const id = str(args.id);
      if (!id) return { error: "update requires `id`" };
      const body: Record<string, unknown> = {};
      if ("type" in args) body.type = args.type;
      if ("data" in args) body.data = asObject(args.data);
      if ("position" in args) body.position = args.position;
      if ("is_visible" in args) body.is_visible = args.is_visible;
      if (Object.keys(body).length === 0)
        return { error: "update needs at least one field to change" };
      return {
        calls: [{ method: "PUT", path: `/api/folio/blocks/${encodeURIComponent(id)}`, body }],
        summary: "update block",
      };
    }
    case "delete": {
      const id = str(args.id);
      if (!id) return { error: "delete requires `id`" };
      return {
        calls: [{ method: "DELETE", path: `/api/folio/blocks/${encodeURIComponent(id)}` }],
        summary: "delete block",
      };
    }
    case "reorder": {
      if (!Array.isArray(args.block_ids) || args.block_ids.length === 0) {
        return { error: "reorder requires a non-empty `block_ids` array" };
      }
      if (!args.block_ids.every((x) => typeof x === "string")) {
        return { error: "block_ids must all be strings" };
      }
      return {
        calls: [
          { method: "PUT", path: "/api/folio/blocks/reorder", body: { block_ids: args.block_ids } },
        ],
        summary: "reorder blocks",
      };
    }
    default:
      return { error: `Unknown action: ${action ?? "(missing)"}` };
  }
}

/** Map a tool call (name + args) to the HTTP request(s) needed, or an error. */
export function planRequest(name: string, rawArgs: unknown): PlanResult {
  const args = asObject(rawArgs);
  switch (name) {
    case "get_folio":
      return { calls: [{ method: "GET", path: "/api/folio" }], summary: "read folio" };
    case "update_folio":
      return planUpdateFolio(args);
    case "manage_blocks":
      return planManageBlocks(args);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
