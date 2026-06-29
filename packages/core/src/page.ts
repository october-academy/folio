// SPDX-License-Identifier: MIT
/**
 * Page-level normalization: socials, theme, settings, and the settings-update
 * builder. Storage-agnostic (no Supabase, no D1 here).
 */
import { z } from "zod";
import { BRAND_KEY_PATTERN } from "./blocks";
import { normalizeUrl, sanitizeText } from "./validation";

/** A social/brand button in the page header: { brand, url }. Max 6. */
export type Social = { brand: string; url: string };

export const MAX_SOCIALS = 6;

/**
 * Theme presets. `auto`/`light`/`dark` are the base modes; the rest are named
 * CSS-variable palettes defined as `.theme-<name>` in globals.css (SPEC §8).
 */
export const THEMES = [
  "auto",
  "light",
  "dark",
  "mint",
  "grape",
  "sunset",
  "midnight",
  "custom",
] as const;
export type Theme = (typeof THEMES)[number];

const THEME_SET: ReadonlySet<string> = new Set(THEMES);

/** CSS-variable names a uploaded/custom theme may override (without the `--`). */
export const CUSTOM_THEME_VARS = [
  "background",
  "foreground",
  "secondary",
  "muted",
  "muted-foreground",
  "border",
  "accent",
  "accent-foreground",
  "accent-text",
] as const;
export type CustomThemeVar = (typeof CUSTOM_THEME_VARS)[number];
export type CustomTheme = Partial<Record<CustomThemeVar, string>>;

const CUSTOM_VAR_SET: ReadonlySet<string> = new Set(CUSTOM_THEME_VARS);
// Hex colors only — eliminates any CSS-injection surface from user input.
const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Keep only known variables with valid hex values (defense against injection). */
export function normalizeCustomTheme(value: unknown): CustomTheme {
  if (!value || typeof value !== "object") return {};
  const out: CustomTheme = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!CUSTOM_VAR_SET.has(key) || typeof raw !== "string") continue;
    const v = raw.trim().toLowerCase();
    if (HEX_COLOR.test(v)) out[key as CustomThemeVar] = v;
  }
  return out;
}

/** An inline-style object of `--var` declarations for a custom theme. */
export function customThemeStyle(theme: CustomTheme): Record<string, string> {
  const style: Record<string, string> = {};
  for (const key of CUSTOM_THEME_VARS) {
    const v = theme[key];
    if (v) style[`--${key}`] = v;
  }
  return style;
}

export const socialSchema = z.object({
  brand: z.string().regex(BRAND_KEY_PATTERN),
  url: z.string(),
});

/** Flexible per-page settings. v0.1 has no required keys; kept open for v0.2. */
export type FolioSettings = Record<string, unknown>;

export function normalizeTheme(value: unknown): Theme {
  return typeof value === "string" && THEME_SET.has(value) ? (value as Theme) : "auto";
}

export function normalizeSettings(value: unknown): FolioSettings {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as FolioSettings)
    : {};
}

/** Normalize an array of socials, dropping invalid entries; clamps to MAX_SOCIALS. */
export function normalizeSocials(
  value: unknown,
  opts: { allowHttpLocal?: boolean } = {},
): Social[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((entry): Social[] => {
      if (!entry || typeof entry !== "object") return [];
      const rec = entry as Record<string, unknown>;
      const brand = sanitizeText(rec.brand, "", 40)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "");
      const url = normalizeUrl(rec.url, opts);
      if (!brand || !BRAND_KEY_PATTERN.test(brand) || !url) return [];
      return [{ brand, url }];
    })
    .slice(0, MAX_SOCIALS);
}

export type ValidationResult<T> = { value: T } | { error: string };

/** Validate socials strictly (for the settings PUT path), returning Korean errors. */
export function validateSocials(
  value: unknown,
  opts: { allowHttpLocal?: boolean } = {},
): ValidationResult<Social[]> {
  if (!Array.isArray(value)) return { error: "socials는 배열이어야 합니다" };
  if (value.length > MAX_SOCIALS) {
    return { error: `socials는 최대 ${MAX_SOCIALS}개까지 허용됩니다` };
  }
  const socials: Social[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      return { error: "socials 항목 형식이 올바르지 않습니다" };
    }
    const rec = entry as Record<string, unknown>;
    const brand = sanitizeText(rec.brand, "", 40)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
    const url = normalizeUrl(rec.url, opts);
    if (!brand || !BRAND_KEY_PATTERN.test(brand)) {
      return { error: "social 항목에는 brand 이름이 필요합니다" };
    }
    if (!url) {
      return { error: "social url은 https:// 링크만 사용할 수 있습니다" };
    }
    socials.push({ brand, url });
  }
  return { value: socials };
}

export type PageSettingsUpdate = {
  display_name?: string;
  avatar_url?: string | null;
  description?: string | null;
  socials?: Social[];
  theme?: Theme;
  settings?: FolioSettings;
  is_published?: boolean;
};

/**
 * Build a partial page update from a raw request body. Only keys present in the
 * body are included. Returns Korean error on invalid socials.
 */
export function buildPageSettingsUpdate(params: {
  body: Record<string, unknown>;
  current: { display_name: string; settings: FolioSettings };
  allowHttpLocal?: boolean;
}): ValidationResult<PageSettingsUpdate> {
  const { body, current } = params;
  const opts = { allowHttpLocal: params.allowHttpLocal };
  const update: PageSettingsUpdate = {};

  if ("display_name" in body) {
    update.display_name = sanitizeText(body.display_name, current.display_name || "Folio", 80);
  }
  if ("avatar_url" in body) {
    update.avatar_url = normalizeUrl(body.avatar_url, opts) ?? null;
  }
  if ("description" in body) {
    update.description = sanitizeText(body.description, "", 240) || null;
  }
  if ("theme" in body) {
    update.theme = normalizeTheme(body.theme);
  }
  if ("is_published" in body) {
    update.is_published = body.is_published !== false;
  }
  if ("socials" in body) {
    const socials = validateSocials(body.socials, opts);
    if ("error" in socials) return socials;
    update.socials = socials.value;
  }
  if ("settings" in body) {
    const merged = normalizeSettings({
      ...current.settings,
      ...normalizeSettings(body.settings),
    });
    if ("custom_theme" in merged) {
      merged.custom_theme = normalizeCustomTheme(merged.custom_theme);
    }
    update.settings = merged;
  }
  return { value: update };
}
