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
  When `ALMANAC_URL` / `ALMANAC_API_KEY` are set, each link becomes an Almanac short link carrying
  a `click_id`, so clicks join to Almanac's click→signup→revenue ledger — *which link earned a
  paying customer*. This is the v0.2 capability; v0.1 ships the standalone PostHog path with the
  schema and seam ready for it.

## 5-minute deploy (Cloudflare)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/october-academy/folio)

```bash
# 1. Clone + install
git clone https://github.com/october-academy/folio.git && cd folio
bun install

# 2. Create the D1 database and apply the schema
cd apps/web
bunx wrangler d1 create folio          # copy the database_id into wrangler.jsonc
bunx wrangler d1 migrations apply folio --remote

# 3. Create the KV namespace for the public-page cache
bunx wrangler kv namespace create FOLIO_CACHE   # copy the id into wrangler.jsonc

# 4. Set your editor token + PostHog key as secrets
bunx wrangler secret put FOLIO_ADMIN_TOKEN
echo 'NEXT_PUBLIC_POSTHOG_KEY=phc_xxx' >> .dev.vars   # for local; set as var/secret for prod

# 5. Build + deploy
bunx opennextjs-cloudflare build && bunx wrangler deploy
```

Open `https://<your-worker>.workers.dev/admin`, paste your `FOLIO_ADMIN_TOKEN`, and build your page.
Your public page is at `/@<slug>`.

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
  apps/web        @folio/web      — Next.js on Cloudflare/OpenNext: public /@slug + /admin editor + APIs + OG
  packages/core   @folio/core     — block taxonomy + D1 schema + zod types (SSOT)
  packages/buttons @folio/buttons — LittleLink brand buttons (MIT): brands.css + icons + brands.json + <BrandButton>
```

- **Storage:** Cloudflare **D1** (`pages`, `blocks`) + **KV** (rendered public-page cache, invalidated on edit).
- **Auth (v0.1):** single-tenant — one Folio per deploy; editor gated by `FOLIO_ADMIN_TOKEN`.
- **Analytics:** PostHog events (standalone) or Almanac short links (full attribution, v0.2).

## License

MIT © October Academy. Brand buttons (`packages/buttons/brands.css` + `icons/*.svg`) are lifted
verbatim from [LittleLink](https://github.com/sethcottle/littlelink) (MIT) — see [`NOTICE`](./NOTICE).
LinkStack (AGPL) was a clean-room reference only; no AGPL code or runtime dependency is included.

## Roadmap

- **v0.1** *(this release)* — single-tenant; D1 pages/blocks; link/heading/text/divider blocks;
  LittleLink brand buttons + URL→platform auto-detect; public `/@slug` (KV cache, OG); editor with
  live preview + drag reorder; PostHog `folio_page_view` / `folio_link_click`.
- **v0.2** — Almanac integration (per-link conversion); favicon fetch; more blocks
  (email/phone/vcard/youtube/qr/image); themes; MCP tools.
- **v1.0** — multi-user + auth; theme upload; import/export; custom domains.
