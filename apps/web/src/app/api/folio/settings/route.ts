import { buildPageSettingsUpdate } from "@folio/core";
import { allowHttpLocal } from "@/lib/cf";
import { getPageById, updatePageSettings } from "@/lib/db";
import { badRequest, invalidate, withEditorPage } from "@/lib/editor-api";

/** PUT /api/folio/settings — update display name, avatar, description, socials, theme. */
export async function PUT(request: Request) {
  const ctx = await withEditorPage(request);
  if (ctx instanceof Response) return ctx;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = buildPageSettingsUpdate({
    body,
    current: { display_name: ctx.page.display_name, settings: ctx.page.settings },
    allowHttpLocal: allowHttpLocal(),
  });
  if ("error" in result) return badRequest(result.error);

  await updatePageSettings(ctx.page.id, result.value);
  await invalidate(ctx.page.slug);

  const updated = await getPageById(ctx.page.id);
  return Response.json({ page: updated });
}
