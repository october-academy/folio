// SPDX-License-Identifier: MIT
import { isImportError, parseImport } from "@folio/core";
import { allowHttpLocal } from "@/lib/cf";
import { bulkCreateBlocks, deleteAllBlocks, updatePageSettings } from "@/lib/db";
import { badRequest, invalidate, withEditorPage } from "@/lib/editor-api";

/**
 * POST /api/folio/import — replace the current Folio's settings + blocks from a
 * portable export doc. The slug is never changed (page identity stays put);
 * deploy-specific Almanac codes are stripped (see parseImport).
 */
export async function POST(request: Request) {
  const ctx = await withEditorPage(request);
  if (ctx instanceof Response) return ctx;

  const body = await request.json().catch(() => null);
  const parsed = parseImport(body, { allowHttpLocal: allowHttpLocal() });
  if (isImportError(parsed)) return badRequest(parsed.error);

  await updatePageSettings(ctx.page.id, parsed.page);
  await deleteAllBlocks(ctx.page.id);
  await bulkCreateBlocks(
    ctx.page.id,
    parsed.blocks.map((b) => ({
      type: b.type,
      data: b.data,
      position: b.position,
      isVisible: b.is_visible,
      pinned: b.pinned,
    })),
  );

  await invalidate(ctx.page.slug);
  return Response.json({ imported: parsed.blocks.length, skipped: parsed.skipped });
}
