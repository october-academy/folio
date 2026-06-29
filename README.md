# Folio

**The link-in-bio that tells you which link actually earns.**

Folio is an open-source, self-hostable [Linktree](https://linktr.ee) alternative that is
**attribution-native**: a `/@you` page of typed blocks and 100+ branded social buttons where
**every link is tracked end-to-end** — from click, to signup, to first revenue. It runs on
**Cloudflare + PostHog only** (no database to manage; storage is Cloudflare D1), ships under
**MIT**, and reuses [LittleLink](https://github.com/sethcottle/littlelink)'s brand-button library.

> Worldview (October Academy): [Almanac](https://github.com/october-academy/almanac) is the
> academy's record book; your **Folio** is your leaf in it.

## Why Folio

|                          | LittleLink | LinkStack   | Linktree     | **Folio**            |
| ------------------------ | ---------- | ----------- | ------------ | -------------------- |
| Open source              | ✅ MIT     | ✅ AGPL     | ❌           | ✅ **MIT**           |
| Self-hosted              | ✅ static  | ✅ PHP/SQL  | ❌           | ✅ **Cloudflare**    |
| Click analytics          | ❌         | ✅          | 💲 paywalled | ✅ **PostHog**       |
| **Conversion / revenue** | ❌         | ❌          | ❌           | ✅ **via Almanac**   |
| Brand buttons (100+)     | ✅         | ✅          | ✅           | ✅ **(LittleLink)**  |
| URL→platform auto-detect | ❌         | ❌          | —            | ✅ **original**      |

## Honesty note (read this)

- **Standalone (PostHog only):** Folio fires `folio_page_view` and `folio_link_click` events to
  PostHog. You get page-view and click funnels — *which links get clicked*.
- **Full conversion attribution requires [Almanac](https://github.com/october-academy/almanac).**
  When `ALMANAC_URL` / `ALMANAC_API_KEY` are set (v0.2), each link is registered as an Almanac short
  link carrying a `click_id`, the public page links through it, and the editor shows per-link
  **clicks · signups · conversions · revenue** — *which link earned a paying customer*. Unset, Folio
  runs fully standalone on the PostHog path; every Almanac call degrades gracefully on failure.

## Deploy to Cloudflare

### One-click

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/october-academy/folio/tree/main/apps/web)

The button (pointed at the `apps/web` subtree of this Turborepo) forks the repo and walks you through
setup. Cloudflare reads [`apps/web/wrangler.jsonc`](apps/web/wrangler.jsonc) for the required bindings and
prompts for each secret/var (descriptions come from the `cloudflare.bindings` block in
[`apps/web/package.json`](apps/web/package.json)). During setup:

- **Root directory:** `apps/web` · **Build command:** `bunx opennextjs-cloudflare build` (this is a
  Next.js app on the [OpenNext](https://opennext.js.org/cloudflare) Cloudflare adapter).
- **Set `FOLIO_ADMIN_TOKEN`** (a long random string — gates the `/admin` editor) and
  `NEXT_PUBLIC_SITE_URL` (your `*.workers.dev` URL). PostHog + Almanac vars are optional.
- **Provision the bindings + apply the schema.** Create the D1 database (`folio`) and KV namespace
  (`FOLIO_CACHE`) — via the dashboard or the CLI below — bind them to the Worker, then apply the
  migrations once:
  ```bash
  bunx wrangler d1 create folio        # bind id → wrangler.jsonc (binding "DB")
  bunx wrangler kv namespace create FOLIO_CACHE   # bind id → wrangler.jsonc (binding "FOLIO_CACHE")
  bunx wrangler d1 migrations apply folio --remote
  ```

> If the deploy flow auto-provisions D1/KV for you, just confirm the bindings and run the migration step.
> Either way the migration is required once — Cloudflare does not run D1 migrations automatically.

### Manual (CLI)

```bash
git clone https://github.com/october-academy/folio.git && cd folio && bun install && cd apps/web
bunx wrangler d1 create folio                    # paste database_id into wrangler.jsonc
bunx wrangler d1 migrations apply folio --remote
bunx wrangler kv namespace create FOLIO_CACHE    # paste id into wrangler.jsonc
bunx wrangler secret put FOLIO_ADMIN_TOKEN
bunx opennextjs-cloudflare build && bunx wrangler deploy
```

Open `https://<your-worker>.workers.dev/admin`, paste your `FOLIO_ADMIN_TOKEN`, and build your page.
Your public page is at `/@<slug>`. For full click→signup→revenue attribution, also deploy the sibling
[Almanac](https://github.com/october-academy/almanac) Worker and set `ALMANAC_URL` + `ALMANAC_API_KEY`.

### Custom domain

Map your own domain in the Cloudflare dashboard → **Workers & Pages → your Worker → Settings →
Domains & Routes → Add → Custom Domain** (e.g. `links.example.com`), or add a `routes` entry to
`wrangler.jsonc`. Cloudflare provisions the TLS cert automatically. Set `NEXT_PUBLIC_SITE_URL` to the
custom domain so OG images and canonical links resolve correctly.

## Local development

```bash
bun install
cp .dev.vars.example apps/web/.dev.vars   # fill in FOLIO_ADMIN_TOKEN etc.
cd apps/web
bunx wrangler d1 migrations apply folio --local
bun run dev     # http://localhost:3000  (editor at /admin)
```

## Architecture

```
folio/  (Turborepo + bun)
  apps/web         @folio/web        — Next.js on Cloudflare/OpenNext: public /@slug + /admin editor + APIs + OG
  apps/mcp-server  @folio/mcp-server — MCP server: edit your Folio from Claude Code / terminal (v0.2)
  packages/core    @folio/core       — block taxonomy + D1 schema + zod types (SSOT)
  packages/buttons @folio/buttons    — LittleLink brand buttons (MIT): brands.css + icons + brands.json + <BrandButton>
```

- **Storage:** Cloudflare **D1** (`pages`, `blocks`) + **KV** (rendered public-page cache, invalidated on edit).
- **Auth:** single-tenant by default (one Folio per deploy, editor gated by `FOLIO_ADMIN_TOKEN`).
  Set `FOLIO_AUTH_MODE=access` + put the Worker behind **Cloudflare Access** for multi-user — each
  signed-in email gets their own page at their own `/@slug` (no email/SMTP infra needed).
- **Analytics:** PostHog events (standalone) or Almanac short links (full attribution, v0.2).
- **Blocks:** `link`, `heading`, `text`, `divider`, `email`, `phone`, `image`, `youtube` (nocookie
  embed), `vcard` (downloadable `.vcf`), `qr` (SSR SVG) — all with live preview.
- **Favicon (v0.2):** links to non-brand hosts get a self-hosted, KV-cached favicon — Folio fetches
  it server-side so visitors never contact a third party. Disable with `FOLIO_FAVICON=off`.

## License

MIT © October Academy. Brand buttons (`packages/buttons/brands.css` + `icons/*.svg`) are lifted
verbatim from [LittleLink](https://github.com/sethcottle/littlelink) (MIT) — see [`NOTICE`](./NOTICE).
LinkStack (AGPL) was a clean-room reference only; no AGPL code or runtime dependency is included.

## Roadmap

- **v0.1** ✅ — single-tenant; D1 pages/blocks; link/heading/text/divider blocks;
  LittleLink brand buttons + URL→platform auto-detect; public `/@slug` (KV cache, OG); editor with
  live preview + drag reorder; PostHog `folio_page_view` / `folio_link_click`.
- **v0.2** ✅ — Almanac integration (per-link conversion in the editor); self-hosted favicon fetch;
  email/phone/vcard/youtube/qr/image blocks; theme presets; `@folio/mcp-server` MCP tools.
- **v1.0** ✅ — multi-user via Cloudflare Access (token mode still default); custom theme upload;
  portable import/export; per-link analytics view; custom-domain docs.
