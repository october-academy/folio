// SPDX-License-Identifier: MIT
import { validateSlug } from "@folio/core";
import { getPageById, isSlugTaken, updateSlug } from "@/lib/db";
import { badRequest, invalidate, withEditorPage } from "@/lib/editor-api";

/** PUT /api/folio/slug — change the page slug (validated + uniqueness-checked). */
export async function PUT(request: Request) {
  const ctx = await withEditorPage(request);
  if (ctx instanceof Response) return ctx;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = validateSlug(body.slug);
  if ("error" in result) return badRequest(result.error, result.status);

  if (await isSlugTaken(result.slug, ctx.page.id)) {
    return badRequest("이미 사용 중인 slug입니다", 409);
  }

  const oldSlug = ctx.page.slug;
  await updateSlug(ctx.page.id, result.slug);
  await invalidate(oldSlug, result.slug);

  const updated = await getPageById(ctx.page.id);
  return Response.json({ page: updated });
}
