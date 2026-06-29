// SPDX-License-Identifier: MIT
import type { LinkBlockData } from "@folio/core";
import { almanacEnabled, getLinkStatsMap } from "@/lib/almanac";
import type { AlmanacStats } from "@/lib/almanac-util";
import { listBlocks } from "@/lib/db";
import { withEditorPage } from "@/lib/editor-api";

/**
 * GET /api/folio/stats — per-link Almanac attribution stats for the editor.
 * Returns `{ enabled, stats: { [blockId]: AlmanacStats } }`. When Almanac is off
 * (or the lookup fails) it returns `enabled:false` / an empty map — the editor
 * simply shows no conversion badges. One batched `/api/links` call covers every
 * link (keyed by short code), then we map each back to its block id.
 */
export async function GET(request: Request) {
  const ctx = await withEditorPage(request);
  if (ctx instanceof Response) return ctx;

  if (!almanacEnabled()) return Response.json({ enabled: false, stats: {} });

  const [blocks, statsByCode] = await Promise.all([listBlocks(ctx.page.id), getLinkStatsMap()]);

  const stats: Record<string, AlmanacStats> = {};
  for (const b of blocks) {
    if (b.type !== "link") continue;
    const code = (b.data as LinkBlockData).almanac_code;
    if (!code) continue;
    const s = statsByCode.get(code);
    if (s) stats[b.id] = s;
  }
  return Response.json({ enabled: true, stats });
}
