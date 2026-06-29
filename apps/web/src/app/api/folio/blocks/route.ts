import { MAX_BLOCKS } from "@folio/core";
import { normalizeIncomingBlock } from "@/lib/block-input";
import { allowHttpLocal } from "@/lib/cf";
import { countBlocks, createBlock } from "@/lib/db";
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

  await invalidate(ctx.page.slug);
  return Response.json({ block }, { status: 201 });
}
