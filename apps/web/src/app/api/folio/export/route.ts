// SPDX-License-Identifier: MIT
import { buildExport } from "@folio/core";
import { listBlocks } from "@/lib/db";
import { withEditorPage } from "@/lib/editor-api";

/** GET /api/folio/export — download a portable, id-free JSON snapshot of the Folio. */
export async function GET(request: Request) {
  const ctx = await withEditorPage(request);
  if (ctx instanceof Response) return ctx;

  const blocks = await listBlocks(ctx.page.id);
  const doc = buildExport(ctx.page, blocks, Date.now());

  return new Response(JSON.stringify(doc, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="folio-${ctx.page.slug}.json"`,
      "cache-control": "no-store",
    },
  });
}
