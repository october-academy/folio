# Folio — V1 Full Specification

> **Folio** — an open-source, self-hostable **link-in-bio** page builder that is **attribution-native**.
> Org: October Academy · License: MIT · Dependencies: **Cloudflare + PostHog only** (storage = D1) · Repo: standalone `folio` · Status: **v0.1 implemented** (this repo) → v0.2/v1.0 per §16

A link-in-bio (Linktree-style) page — `folio.example/@you` — with typed blocks, 100+ branded social buttons, themes, and OG/SEO. Unlike every other OSS link-in-bio, **every link is tracked end-to-end**: paste-to-click-to-signup-to-revenue, by riding **Almanac** (the sibling attribution layer) or PostHog directly. Answers: *"which of my bio links actually earns?"*

Worldview (October Academy): Almanac is the academy's record book; your **Folio** is your leaf in it. A block is a **Leaf**, a social/brand button is a **Mark**.

---

## 0. TL;DR

A Cloudflare-hosted link-in-bio whose pages and blocks live in D1, whose look reuses LittleLink's MIT brand-button library, whose block taxonomy is learned (clean-room) from LinkStack, and whose differentiator is attribution: each bio link is an Almanac-tracked click (or a PostHog event), so you can attribute followers → paying customers. The login-deterministic, OSS, self-hosted answer to Linktree — with the analytics Linktree charges for and LinkStack/LittleLink don't have.

## 1. Product definition

- **What:** OSS, self-hosted link-in-bio page builder with built-in click→conversion attribution.
- **Who:** solo developers / indie creators who want a Linktree they own, and who care *which* link drives signups/sales (not just click counts). First user = the Agentic30 founder (dogfood the `/@handle` bio).
- **Why:** LittleLink is static (no analytics); LinkStack counts clicks but is AGPL/PHP/heavy and has no conversion attribution; Linktree is closed and paywalls analytics. None tells you which bio link produced a paying customer.

## 2. Positioning & non-goals

**Benchmarks:** LittleLink (MIT, static button collection — borrow the buttons), LinkStack (AGPL, PHP/Laravel, full self-host platform — learn the feature taxonomy, no code), Linktree/Bento (closed). **Moat:** attribution-native (Almanac/PostHog) + Cloudflare-native deploy + MIT.

**Non-goals (v1):**
- ❌ A LinkStack-scale multi-tenant SaaS (admin panel, theme marketplace, SMTP, backup system) — defer.
- ❌ Pluggable third-party block plugins (LinkStack `linkstack-blocks`) — defer; ship a fixed typed block set.
- ❌ A statistical analytics product — it rides PostHog funnels; it doesn't rebuild them.
- ❌ Reinventing social icons — lift LittleLink's MIT brand buttons.

## 3. Architecture (Cloudflare + PostHog only)

```
Repo `folio` (standalone, Turborepo + bun):
  apps/web        @folio/web      — Next.js (on Cloudflare Workers/OpenNext): public page + editor
  packages/core   @folio/core     — block taxonomy + D1 schema + types (SSOT)
  packages/buttons @folio/buttons — LittleLink brand buttons (MIT): brands.css + icons + brands.json + <BrandButton>
Cloudflare:  Worker/Pages (SSR public page + editor API) + D1 (pages/blocks) + KV (public-page cache) + R2 (avatars/uploads, optional)
PostHog:     page_view + link_click events; rides PostHog funnels for analytics
Almanac (optional, first-class): if ALMANAC_URL set, each bio link is an Almanac short link (click_id) → full click→signup→revenue
```

## 4. Almanac integration (the differentiator)

Folio works two ways:
- **Standalone (PostHog):** a `link` block click fires a PostHog `folio_link_click` event with the visitor distinct_id + the page/link ids → page→click funnels in PostHog.
- **Almanac-powered (full attribution):** if `ALMANAC_URL`/`ALMANAC_API_KEY` are configured, each link block is registered as an **Almanac short link** carrying a `click_id`; clicks flow through Almanac (click→signup→payment join in Almanac's D1 ledger). This is the unique capability — *which bio link earned a paying customer* — that neither LittleLink nor LinkStack has.

The link block stores both the destination URL and (when Almanac is on) the Almanac short code, so the page can render the short link and the editor shows per-link conversion, not just clicks.

## 5. Data model — Cloudflare D1 (no Supabase, no profiles FK)

```sql
pages(
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,                 -- /@slug  (^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$)
  owner_id TEXT,                             -- opaque owner (single-user v0.1 = a constant)
  display_name TEXT NOT NULL,
  avatar_url TEXT, description TEXT,
  socials TEXT NOT NULL DEFAULT '[]',        -- json: [{brand, url}]
  theme TEXT NOT NULL DEFAULT 'auto',        -- auto|light|dark|<custom>
  settings TEXT NOT NULL DEFAULT '{}',       -- json (flexible)
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER, updated_at INTEGER
)
blocks(
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,                      -- FK pages.id (cascade in app)
  type TEXT NOT NULL,                         -- §6
  position INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  pinned INTEGER NOT NULL DEFAULT 0,          -- "up_link" (LinkStack)
  data TEXT NOT NULL DEFAULT '{}',            -- json, per-type (= LinkStack type_params)
  created_at INTEGER, updated_at INTEGER
)
-- v0.2 multi-user:
users(id TEXT PRIMARY KEY, email TEXT UNIQUE, role TEXT, created_at INTEGER)
```
Indexes: `pages(slug)` UNIQUE; `blocks(page_id, position)`. KV caches the rendered public payload by slug (invalidated on edit). Click/view counts live in PostHog (+ optional D1 aggregate). When Almanac is on, the durable click ledger is Almanac's D1, not Folio's.

## 6. Block taxonomy (`@folio/core` SSOT)

Learned (clean-room) from LinkStack's `type` + `type_params` + our needs. Each block's `data` jsonb is type-specific:

| type | data fields |
|---|---|
| `link` | `{ url, title, brand?, icon?, almanac_code?, custom_css? }` — brand → LittleLink button; else favicon |
| `heading` | `{ text }` |
| `text` | `{ text }` (markdown-lite) |
| `divider` / `spacer` | `{ size? }` |
| `email` | `{ email, title }` → `mailto:` |
| `phone` | `{ phone, title }` → `tel:` |
| `vcard` | `{ name, org, email, phone, ... }` → downloadable `.vcf` |
| `youtube` | `{ video_id }` (oembed) |
| `qr` | `{ target }` → QR of a link/page |
| `image` | `{ url, alt, href? }` |

Dropped from the Agentic30 original: `landing_card` and the gamification toggles (level/badges/landings) — Agentic30-specific.

> **v0.1 shipped `link` / `heading` / `text` / `divider`.** v0.2 adds the remaining
> types: `email` (mailto), `phone` (tel), `image` (optional tracked href), `youtube`
> (privacy-friendly `youtube-nocookie` embed), `vcard` (downloadable `.vcf` via a
> `data:` URI), and `qr` (SSR-rendered SVG, black-on-white, via the MIT
> `qrcode-generator` lib). email/phone/image fire the standalone `folio_link_click`
> event (with a `kind` prop); youtube/vcard/qr are inert/static.

## 7. Brand button system (LittleLink, MIT — lifted)

- Ship LittleLink's `css/brands.css` (per-brand `.button-{brand}` setting `--button-text/--button-background/--button-border`) + `images/icons/{brand}.svg` (full-color SVGs, no recolor) verbatim (MIT, with attribution in NOTICE).
- Build step parses `brands.css` → `brands.json` manifest (`{ brand, label, text, background, border, icon, alt? }`) for 100+ brands.
- `<BrandButton brand="github" href label />` renders `<a class="button button-github"><img class="icon" src=".../github.svg">…</a>`.
- **URL→platform auto-detect (our original feature — neither benchmark does it):** a hostname→brand map (`github.com`→`github`, `x.com`/`twitter.com`→`x`, …) auto-assigns the brand button when a user pastes a link. Falls back to favicon fetch for unknown hosts.

## 8. Public page + OG/SEO

- SSR at `/@slug` (and `/[slug]`), cached in KV, fast TTFB on Cloudflare. CSS-variable theme (auto/light/dark) from LittleLink pattern.
- Per-page OG image generated at the edge (`/api/og/[slug]` via `@vercel/og`/Satori) — reuse the existing Agentic30 implementation.
- Favicon fetch for custom links (v0.2): a link block whose host has no LittleLink brand renders `<img src="/api/favicon?u=…">`. That route fetches the icon from the Google s2 favicon service **server-side**, caches the bytes in KV (30-day TTL; 1-hour negative cache), and self-serves them — so a public-page visitor's browser only ever contacts Folio, never the upstream. Any miss/failure redirects to the bundled generic icon. Disable third-party fetch with `FOLIO_FAVICON=off`. Clean-room of LinkStack's fetch-and-cache mechanism (no code copied).
- `BioPageTracker` fires a PostHog `folio_page_view` (or an Almanac `bio_page_view` when Almanac is on).

## 9. Editor

- Auth'd settings UI + **live preview** + **drag-and-drop reorder** (reuse the existing Agentic30 `BioSettingsClient`/`BioLivePreview`). Block CRUD + reorder API.
- MCP tools (`update_folio`, `manage_blocks`, `get_folio`) — reuse the existing `bio.ts` MCP tools (create/edit a Folio from Claude Code / terminal — agentic-native, on-brand for the ICP).

## 10. Auth / ownership

- **v0.1 = single-tenant:** one Folio per deploy; the editor is gated by an admin token (env `FOLIO_ADMIN_TOKEN`) or Cloudflare Access. No Supabase, no user table. `owner_id` is a constant. (Mirrors LinkStack "single-user mode" — the common indie self-host case.)
- **v0.2 = multi-user:** `users` table + email magic-link (Resend/any SMTP) or Cloudflare Access; per-user `/@handle`; optional open registration.

## 11. Analytics (the moat)

- Standalone: PostHog events `folio_page_view`, `folio_link_click` (props: slug, block_id, brand, target_host). Build page→click funnels in PostHog (the dashboard is PostHog, not custom).
- Almanac-powered: link clicks are Almanac short-link clicks (click_id) → click→signup→revenue. The editor shows per-link **conversions/first-revenue**, not just clicks — the thing Linktree paywalls and LinkStack/LittleLink can't do.

## 12. Privacy & consent

Public-page view/click tracking sends a pseudonymous PostHog distinct_id (+ coarse referrer). No raw IP stored by Folio; geo via coarse CF header only. If Almanac/ad-click-ids are involved, defer to Almanac's consent gate. Favicon fetch via a third party (Google/DuckDuckGo) is a privacy note — document it; allow self-hosted favicon fallback.

## 13. Licensing

- **Folio = MIT.** SPDX headers; per-package LICENSE.
- **LittleLink = MIT → lifted** (brands.css + icons); add a `NOTICE` crediting LittleLink (sethcottle/littlelink).
- **LinkStack = AGPL-3.0 + PHP → ideas only** (block taxonomy, favicon-fetch pattern); never copy code (different language anyway → no accidental port).
- No AGPL runtime dependency. If a UA/device lib is ever needed, follow Almanac's rule (CF headers, not `ua-parser-js`).

## 14. Reuse from the existing Agentic30 bio (~5.3k lines)

Reuse (port from `apps/web/src/app/bio/**`, `app/settings/bio/**`, `api/bio/**`, `api/og/bio/**`, `mcp-server/src/tools/bio.ts`): the block model + renderers (`blocks.tsx`), public page + metadata/OG, editor + live preview, slug/settings/blocks/reorder APIs, MCP tools, the `BioPageTracker`. **Re-target storage Supabase → D1; strip:** `profiles` FK, RLS, gamification (level/badges/landing_card), Agentic30 domains, the `landing_card` block. **New:** D1 layer, brand-button lift, URL→platform auto-detect, Almanac link integration, single-tenant admin-token auth.

## 15. Repo structure

```
folio/
  apps/web/          @folio/web      (Next.js on Cloudflare: public page + editor + APIs + OG)
  packages/core/     @folio/core     (block taxonomy + D1 schema + zod types SSOT)
  packages/buttons/  @folio/buttons  (LittleLink brands.css + icons + brands.json + <BrandButton>)
  migrations/        D1 schema
  examples/ · LICENSE (MIT) · NOTICE (LittleLink MIT) · turbo.json · README.md
```

## 16. Roadmap

| Phase | Scope | "Done" |
|---|---|---|
| **v0.1** | single-tenant; D1 pages/blocks; core blocks (link/heading/text/divider); LittleLink brand buttons + URL auto-detect; public `/@slug` (KV cache, OG); editor + live preview + reorder; PostHog `folio_page_view`/`folio_link_click` | publish a Folio, links tracked in PostHog, 5-min Cloudflare deploy |
| **v0.2** | **Almanac integration** (links → Almanac click_id → per-link conversion); favicon fetch; more blocks (email/phone/vcard/youtube/qr/image); themes; MCP tools | a bio link's first paid conversion attributed via Almanac |
| **v1.0** | multi-user + auth; theme upload; import/export; custom domains; per-link analytics view | teams; documented per-surface reliability |

## 17. Definition of done (v0.1)

- `typecheck` + `lint` clean; unit tests for the block renderers, the brand-button manifest extraction, and the slug/blocks APIs; e2e: create page → add link → publish → `/@slug` renders → click fires PostHog event.
- **MIT gate:** no AGPL runtime dep; `NOTICE` credits LittleLink (MIT); per-package LICENSE + SPDX.
- **D1-only storage:** no Supabase; pages/blocks in D1; public payload cached in KV.
- **Deploy:** Cloudflare Deploy Button; `.dev.vars.example`; admin-token-gated editor; no Agentic30 config.
- **Honesty:** standalone = clicks/views via PostHog; full conversion attribution requires Almanac (documented).

## 18. References

LittleLink (sethcottle/littlelink, MIT — brand buttons, button HTML/CSS-var structure, full-color SVGs, no manifest → parse brands.css). LinkStack (LinkStackOrg/LinkStack, AGPL/PHP — block `type`+`type_params` taxonomy, favicon via Google Favicon API + cache + fallback, manual link-type selection i.e. NO url auto-detect). Almanac SPEC (the sibling repo `github.com/october-academy/almanac`) for the attribution layer and Cloudflare+PostHog/D1 conventions. Verified via deepwiki (both repos) + exa.
