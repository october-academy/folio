// SPDX-License-Identifier: MIT
import { detectBrand } from "@folio/buttons";
import { type NormalizeResult, normalizeBlockData } from "@folio/core";

/**
 * Normalize an incoming block, auto-assigning the LittleLink brand from the URL
 * (Folio's URL→platform auto-detect) when a link block has no explicit brand.
 * Pure — no Cloudflare/server coupling, so it is unit-testable.
 */
export function normalizeIncomingBlock(
  type: unknown,
  data: unknown,
  opts: { allowHttpLocal?: boolean } = {},
): NormalizeResult {
  const raw = data && typeof data === "object" ? { ...(data as Record<string, unknown>) } : {};
  if (type === "link" && typeof raw.url === "string" && !raw.brand) {
    const detected = detectBrand(raw.url);
    if (detected) raw.brand = detected;
  }
  return normalizeBlockData(type, raw, opts);
}
