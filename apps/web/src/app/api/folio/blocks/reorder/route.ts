// SPDX-License-Identifier: MIT
import { normalizeReorderPayload } from "@folio/core";
import { blockIdsOnPage, reorderBlocks } from "@/lib/db";
import { badRequest, invalidate, withEditorPage } from "@/lib/editor-api";

/** PUT /api/folio/blocks/reorder — persist a new block order. */
export async function PUT(request: Request) {
  const ctx = await withEditorPage(request);
  if (ctx instanceof Response) return ctx;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const normalized = normalizeReorderPayload(body);
  if ("error" in normalized) return badRequest(normalized.error);

  const owned = await blockIdsOnPage(ctx.page.id);
  if (normalized.blocks.some((b) => !owned.has(b.id))) {
    return badRequest("일부 블록을 찾을 수 없습니다");
  }

  await reorderBlocks(ctx.page.id, normalized.blocks);
  await invalidate(ctx.page.slug);
  return Response.json({ reordered: true });
}
