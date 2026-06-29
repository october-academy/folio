// SPDX-License-Identifier: MIT
import { detectBrand } from "@folio/buttons";
import { type NormalizedBlock, normalizeBlockData } from "@folio/core";

/**
 * A sample Folio, authored as a list of URLs + a couple of structural blocks.
 * This is the smallest demonstration of Folio's original feature: paste a URL,
 * get the right LittleLink brand button automatically (no manual platform pick).
 */
export const SAMPLE_LINKS: Array<{ url: string; title: string }> = [
  { url: "https://github.com/october-academy", title: "Our code" },
  { url: "https://x.com/october_academy", title: "Follow on X" },
  { url: "https://www.youtube.com/@october-academy", title: "Watch on YouTube" },
  { url: "https://discord.gg/example", title: "Join Discord" },
  { url: "https://buymeacoffee.com/october", title: "Buy me a coffee" },
  { url: "https://example.com/blog", title: "Blog" }, // unknown host → no brand → favicon/generic
];

/**
 * Build the sample Folio's blocks. Mirrors what the editor API does on the
 * server: auto-detect the brand from the URL, then normalize each block.
 */
export function buildSampleBlocks(): NormalizedBlock[] {
  const blocks: NormalizedBlock[] = [];

  const heading = normalizeBlockData("heading", { text: "Find us" });
  if (!("error" in heading)) blocks.push(heading);

  for (const link of SAMPLE_LINKS) {
    const brand = detectBrand(link.url); // URL → LittleLink brand key (or undefined)
    const block = normalizeBlockData("link", { ...link, ...(brand ? { brand } : {}) });
    if (!("error" in block)) blocks.push(block);
  }

  const divider = normalizeBlockData("divider", { size: "md" });
  if (!("error" in divider)) blocks.push(divider);

  const text = normalizeBlockData("text", {
    text: "Built with Folio — every link is tracked.",
  });
  if (!("error" in text)) blocks.push(text);

  return blocks;
}
