# sample-folio

The smallest end-to-end proof of Folio's original feature: **paste a URL, get the
right [LittleLink](https://github.com/sethcottle/littlelink) brand button
automatically** — no manual platform picker (which LinkStack/Linktree require).

## The proof (no network)

`src/blocks.test.ts` builds a sample Folio from a list of plain URLs and asserts
each known host resolved to the correct brand key (`github.com → github`,
`x.com → x`, `youtube.com → yt`, `buymeacoffee.com → coffee`, …) while an unknown
host gets no brand (so the renderer falls back to a favicon/generic button). Run it:

```bash
bun test
```

`src/blocks.ts` is the reusable bit — it composes `@folio/buttons`'
`detectBrand(url)` with `@folio/core`'s `normalizeBlockData()`, exactly like the
editor API does on the server.

## The real integration (seed a live Folio)

Once you have a Folio running (`bun run dev`) with an admin token, you can POST
the sample blocks straight into it via the editor API:

```ts
import { buildSampleBlocks } from "./src/blocks";

const base = process.env.FOLIO_URL ?? "http://localhost:3000";
const token = process.env.FOLIO_ADMIN_TOKEN; // same as your deploy

for (const block of buildSampleBlocks()) {
  await fetch(`${base}/api/folio/blocks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(block), // { type, data }
  });
}
// Open http://localhost:3000/ — your sample Folio is live.
```
