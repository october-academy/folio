# Folio — Build Goal Prompt

> **Status:** v0.1 is implemented (see [`SPEC.md`](./SPEC.md) §16). This is the original
> autonomous-build directive, kept in-repo for provenance and to drive v0.2 → v1.0.

> Paste this as the goal when running Claude Code (autonomous/agentic build). Self-contained, but the **authoritative detail lives in [`docs/SPEC.md`](./SPEC.md)** — read it in full first. Folio is the sibling of Almanac (`github.com/october-academy/almanac`); read that too for the shared Cloudflare+PostHog+D1 conventions and the attribution integration.

---

## Mission

Build **Folio**, an open-source (MIT) **link-in-bio** page builder that is **attribution-native**, on **Cloudflare + PostHog only** (storage = D1), per `docs/SPEC.md`. A Folio is a `/@slug` page of typed blocks + 100+ branded social buttons; every link is tracked end-to-end (PostHog standalone, or full click→signup→revenue when the sibling **Almanac** is configured). It is the OSS, self-hosted, login-deterministic answer to Linktree, with analytics Linktree paywalls and LittleLink/LinkStack don't have.

Deliver **v0.1** end-to-end first, then proceed v0.2 → v1.0 per the SPEC roadmap. Stop and verify at each phase gate.

## Where to build

This is a **standalone monorepo `folio`** (Turborepo + bun), separate from both the Agentic30 repo and the Almanac repo. v0.1 was built by **porting ~5.3k lines from the Agentic30 bio feature** (`apps/web/src/app/bio/**`, `apps/web/src/app/settings/bio/**`, `apps/web/src/app/api/bio/**`, `apps/web/src/app/api/og/bio/**`, `apps/mcp-server/src/tools/bio.ts`) and re-targeting storage Supabase → D1 — see SPEC §14 for what was lifted vs stripped.

## Hard constraints (non-negotiable)

1. **Dependencies = Cloudflare + PostHog only.** Storage = **D1** (pages/blocks) + KV (public-page cache) + R2 (optional uploads). NO Supabase, NO Supabase Auth, NO `profiles` FK. Analytics/dashboard = PostHog (don't build a custom analytics product).
2. **License = MIT.** Lift LittleLink's brand buttons (MIT) — ship `brands.css` + `images/icons/*.svg` verbatim and add a `NOTICE` crediting `sethcottle/littlelink`. LinkStack is AGPL/PHP → **ideas only, never copy code** (clean-room the block taxonomy + favicon-fetch pattern). No AGPL runtime dependency; if UA/device parsing is ever needed, use CF headers (not `ua-parser-js`).
3. **Storage migration:** re-target the ported bio code from Supabase → D1. Drop RLS, `profiles` FK, gamification (level/badges/landings), the `landing_card` block, and Agentic30 domains.
4. **Auth (v0.1) = single-tenant:** one Folio per deploy; editor gated by `FOLIO_ADMIN_TOKEN` (or Cloudflare Access). `owner_id` is a constant. No user table yet (multi-user is v0.2).
5. **Almanac integration is optional + first-class:** if `ALMANAC_URL`/`ALMANAC_API_KEY` are set, each `link` block is registered as an Almanac short link (carries a `click_id`) so clicks join to Almanac's click→signup→revenue ledger. If unset, a link click fires a PostHog `folio_link_click` event directly. Folio must work fully standalone without Almanac.
6. **URL→platform auto-detect is our original feature** (LinkStack does NOT do it): a hostname→brand map auto-assigns the LittleLink brand button when a user pastes a link; fall back to favicon fetch for unknown hosts.
7. **Brand-button source of truth:** build-step parses `brands.css` → `brands.json` manifest; `<BrandButton brand>` renders from it. Brand SVGs are full-color (no recolor).

## Phase 1 — v0.1 (this run)

1. `@folio/core` — block taxonomy (§6: link/heading/text/divider + the `data` jsonb per type) + D1 schema (§5: `pages`, `blocks`) + zod types (hand-written, no codegen).
2. `@folio/buttons` — lift LittleLink `brands.css` + `icons/*.svg`; build-step → `brands.json`; `<BrandButton>`; the hostname→brand auto-detect map. NOTICE crediting LittleLink.
3. `apps/web` (Next.js on Cloudflare/OpenNext) — port from the existing bio code, re-targeted to D1:
   - public `/@slug` (and `/[slug]`) SSR, cached in KV, CSS-variable theme (auto/light/dark);
   - per-page OG image (reuse `api/og/bio`);
   - editor: settings UI + **live preview** + **drag-and-drop reorder** (reuse `BioSettingsClient`/`BioLivePreview`) + block CRUD/reorder APIs, gated by `FOLIO_ADMIN_TOKEN`;
   - `folio_page_view` + `folio_link_click` PostHog events (the standalone analytics path).
   - D1 `migrations/` for `pages`/`blocks`.

## Definition of done — v0.1

- `typecheck` + `lint` clean; unit tests for the block renderers, the `brands.json` extraction, and the slug/blocks APIs; one e2e: create page → add a `link` block → publish → `/@slug` renders the brand button → clicking fires `folio_link_click` in PostHog.
- **MIT gate:** no AGPL runtime dep; `NOTICE` credits LittleLink (MIT); per-package LICENSE + SPDX.
- **D1-only:** no Supabase anywhere; pages/blocks in D1; public payload cached in KV (invalidated on edit).
- **Deploy:** Cloudflare Deploy Button; `.dev.vars.example`; admin-token-gated editor; no Agentic30 config or domains.
- `README.md`: worldview one-liner, the "standalone = PostHog clicks; full conversion attribution needs Almanac" honesty note, and a 5-minute deploy quickstart.

## Then (do not start until v0.1 is green)

- **v0.2:** Almanac integration (links → Almanac `click_id` → per-link conversion shown in the editor); favicon fetch (Google/DuckDuckGo + KV/R2 cache + fallback); more blocks (email/phone/vcard/youtube/qr/image); themes; MCP tools (`update_folio`/`manage_blocks`/`get_folio`, ported from `bio.ts`).
- **v1.0:** multi-user + auth (email magic-link or CF Access, `users` table, `/@handle`); theme upload; import/export; custom domains.

## Working rules

- Read `docs/SPEC.md` (and the Almanac repo for shared conventions) before writing code; keep SPEC updated if a decision changes.
- Build the smallest thing that proves each phase gate; run it and observe the D1 row + the rendered page + the PostHog event before claiming done.
- Honor "한 패키지 = 한 역할": start with `@folio/core` + `@folio/buttons` + `apps/web`; don't add packages speculatively.
- Commit small, working units; keep the dependency graph MIT-clean (LittleLink MIT lift + NOTICE; no AGPL/LinkStack code) at every commit.
