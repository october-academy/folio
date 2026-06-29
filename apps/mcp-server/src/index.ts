#!/usr/bin/env bun
// SPDX-License-Identifier: MIT
/**
 * Folio MCP server (stdio). Exposes get_folio / update_folio / manage_blocks,
 * driving the authenticated Folio editor HTTP API. Configure with env:
 *   FOLIO_URL          base URL of the deployed (or local) Folio (default http://localhost:3000)
 *   FOLIO_ADMIN_TOKEN  the editor admin token
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { FolioClient } from "./client.js";
import { isPlanError, planRequest, TOOL_DEFINITIONS } from "./tools.js";

const baseUrl = process.env.FOLIO_URL ?? "http://localhost:3000";
const token = process.env.FOLIO_ADMIN_TOKEN ?? "";
const client = new FolioClient({ baseUrl, token });

const server = new Server({ name: "folio", version: "0.1.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOL_DEFINITIONS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!token) {
    return { isError: true, content: [{ type: "text", text: "FOLIO_ADMIN_TOKEN is not set." }] };
  }

  const plan = planRequest(name, args ?? {});
  if (isPlanError(plan)) {
    return { isError: true, content: [{ type: "text", text: plan.error }] };
  }

  try {
    const result = await client.run(plan);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (e) {
    return {
      isError: true,
      content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }],
    };
  }
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout is the MCP transport; diagnostics go to stderr.
  console.error(`[folio-mcp] connected — targeting ${baseUrl}`);
}

main().catch((e) => {
  console.error("[folio-mcp] fatal:", e);
  process.exit(1);
});
