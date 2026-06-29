// SPDX-License-Identifier: MIT
import type { LinkBlockData } from "@folio/core";
import { almanacEnabled, getLinkStats } from "@/lib/almanac";
import type { AlmanacStats } from "@/lib/almanac-util";
import { listBlocks } from "@/lib/db";
import { withEditorPage } from "@/lib/editor-api";

/**
 * GET /api/folio/stats — per-link Almanac attribution stats for the editor.
 * Returns `{ enabled, stats: { [blockId]: AlmanacStats } }`. When Almanac is off
 * (or every lookup fails) it returns `enabled:false` / an empty map — the editor
 * simply shows no conversion badges.
 */
export async function GET(request: Request) {
  const ctx = await withEditorPage(request);
  if (ctx instanceof Response) return ctx;

  if (!almanacEnabled()) return Response.json({ enabled: false, stats: {} });

  const blocks = await listBlocks(ctx.page.id);
  const coded = blocks.flatMap((b) => {
    const code = b.type === "link" ? (b.data as LinkBlockData).almanac_code : undefined;
    return code ? [{ id: b.id, code }] : [];
  });

  const entries = await Promise.all(
    coded.map(async ({ id, code }) => [id, await getLinkStats(code)] as const),
  );

  const stats: Record<string, AlmanacStats> = {};
  for (const [id, s] of entries) if (s) stats[id] = s;
  return Response.json({ enabled: true, stats });
}
