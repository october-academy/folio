// SPDX-License-Identifier: MIT
import { type LinkBlockData, MAX_BLOCKS } from "@folio/core";
import { ensureAlmanacCode } from "@/lib/almanac";
import { normalizeIncomingBlock } from "@/lib/block-input";
import { allowHttpLocal } from "@/lib/cf";
import { countBlocks, createBlock, updateBlock } from "@/lib/db";
import { badRequest, invalidate, withEditorPage } from "@/lib/editor-api";

/** POST /api/folio/blocks — create a block. */
export async function POST(request: Request) {
  const ctx = await withEditorPage(request);
  if (ctx instanceof Response) return ctx;

  const count = await countBlocks(ctx.page.id);
  if (count >= MAX_BLOCKS) {
    return badRequest(`블록은 최대 ${MAX_BLOCKS}개까지 추가할 수 있습니다`);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const normalized = normalizeIncomingBlock(body.type, body.data, {
    allowHttpLocal: allowHttpLocal(),
  });
  if ("error" in normalized) return badRequest(normalized.error);

  const position = typeof body.position === "number" && body.position >= 0 ? body.position : count;
  const block = await createBlock({
    pageId: ctx.page.id,
    type: normalized.type,
    data: normalized.data,
    position,
    isVisible: body.is_visible !== false,
  });

  // Register the link as an Almanac short link (no-op when Almanac is off).
  if (block.type === "link") {
    const withCode = await ensureAlmanacCode(block.id, block.data as LinkBlockData);
    if (withCode.almanac_code) {
      await updateBlock({
        id: block.id,
        pageId: ctx.page.id,
        type: "link",
        data: withCode,
        position: block.position,
        isVisible: block.is_visible,
      });
      block.data = withCode;
    }
  }

  await invalidate(ctx.page.slug);
  return Response.json({ block }, { status: 201 });
}
