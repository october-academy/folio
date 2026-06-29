import { normalizeIncomingBlock } from "@/lib/block-input";
import { allowHttpLocal } from "@/lib/cf";
import { deleteBlock, getBlock, updateBlock } from "@/lib/db";
import { badRequest, invalidate, withEditorPage } from "@/lib/editor-api";

/** PUT /api/folio/blocks/[id] — update a block. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await withEditorPage(request);
  if (ctx instanceof Response) return ctx;

  const { id } = await params;
  const existing = await getBlock(id, ctx.page.id);
  if (!existing) return badRequest("블록을 찾을 수 없습니다", 404);

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const nextType = typeof body.type === "string" ? body.type : existing.type;
  // Merge data when the type is unchanged (partial edits); replace on type change.
  const mergedData =
    nextType === existing.type
      ? { ...(existing.data as Record<string, unknown>), ...(body.data as object) }
      : body.data;

  const normalized = normalizeIncomingBlock(nextType, mergedData, {
    allowHttpLocal: allowHttpLocal(),
  });
  if ("error" in normalized) return badRequest(normalized.error);

  await updateBlock({
    id,
    pageId: ctx.page.id,
    type: normalized.type,
    data: normalized.data,
    position:
      typeof body.position === "number" && body.position >= 0 ? body.position : existing.position,
    isVisible: typeof body.is_visible === "boolean" ? body.is_visible : existing.is_visible,
  });

  await invalidate(ctx.page.slug);
  const updated = await getBlock(id, ctx.page.id);
  return Response.json({ block: updated });
}

/** DELETE /api/folio/blocks/[id] — remove a block. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await withEditorPage(request);
  if (ctx instanceof Response) return ctx;

  const { id } = await params;
  const existing = await getBlock(id, ctx.page.id);
  if (!existing) return badRequest("블록을 찾을 수 없습니다", 404);

  await deleteBlock(id, ctx.page.id);
  await invalidate(ctx.page.slug);
  return Response.json({ deleted: true });
}
