// SPDX-License-Identifier: MIT
import { getSiteUrl } from "@/lib/cf";
import { listBlocks } from "@/lib/db";
import { withEditorPage } from "@/lib/editor-api";

/** GET /api/folio — load the owner's page + blocks for the editor. */
export async function GET(request: Request) {
  const ctx = await withEditorPage(request);
  if (ctx instanceof Response) return ctx;

  const blocks = await listBlocks(ctx.page.id);
  return Response.json({
    page: ctx.page,
    blocks,
    public_url: `${getSiteUrl()}/@${ctx.page.slug}`,
    auth: { role: ctx.owner.role, email: ctx.owner.email ?? null },
  });
}
