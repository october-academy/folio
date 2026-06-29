# @folio/mcp-server

An [MCP](https://modelcontextprotocol.io) server that lets Claude Code (or any MCP
client) create and edit a Folio from the terminal — agentic-native editing, on-brand
for the indie-developer ICP.

It's a thin client over the same authenticated Folio editor HTTP API the web editor
uses, so all validation/normalization stays in one place.

## Tools

| tool | what it does |
| --- | --- |
| `get_folio` | Read page settings + all blocks. |
| `update_folio` | Update settings (`display_name`, `description`, `avatar_url`, `theme`, `socials`, `is_published`) and/or `slug`. Only provided fields change. |
| `manage_blocks` | `action: create \| update \| delete \| reorder` over blocks. |

## Configure

Set the target Folio + admin token via env:

| env | default | notes |
| --- | --- | --- |
| `FOLIO_URL` | `http://localhost:3000` | base URL of your deployed (or local) Folio |
| `FOLIO_ADMIN_TOKEN` | — | the editor admin token (same as the web editor) |

### Claude Code

```jsonc
// .mcp.json (or your client's MCP config)
{
  "mcpServers": {
    "folio": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/folio/apps/mcp-server/src/index.ts"],
      "env": {
        "FOLIO_URL": "https://your-folio.workers.dev",
        "FOLIO_ADMIN_TOKEN": "your-token"
      }
    }
  }
}
```

## Example tool calls

```jsonc
// add a GitHub link (brand auto-detected from the URL, server-side)
{ "tool": "manage_blocks", "args": {
  "action": "create", "type": "link",
  "data": { "url": "https://github.com/october-academy", "title": "GitHub" } } }

// switch theme + set the handle
{ "tool": "update_folio", "args": { "theme": "midnight", "slug": "hogyun" } }

// reorder
{ "tool": "manage_blocks", "args": { "action": "reorder", "block_ids": ["id-b", "id-a"] } }
```

MIT © October Academy.
