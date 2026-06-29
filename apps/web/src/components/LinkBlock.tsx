"use client";
// SPDX-License-Identifier: MIT

import { BrandButton, getBrand } from "@folio/buttons";
import { hostnameOf, type LinkBlockData } from "@folio/core";
import { faviconProxyUrl } from "@/lib/favicon-util";
import { capture } from "@/lib/posthog-client";
import { cn } from "@/lib/utils";
import { CARD_PAD } from "./block-chrome";

/**
 * A link block on the public page. Fires `folio_link_click` on click
 * (standalone analytics path). Renders a LittleLink brand button when the link
 * has a known brand, otherwise a brutalist favicon/generic button.
 */
export function LinkBlock({ id, slug, data }: { id: string; slug: string; data: LinkBlockData }) {
  const { url, title, brand, favicon_url, description, highlight, almanac_url } = data;
  // When Almanac is on, link through its short URL so the click joins the
  // click→signup→revenue ledger; otherwise link straight to the destination.
  const href = almanac_url ?? url;

  const onClick = () => {
    capture("folio_link_click", {
      slug,
      block_id: id,
      brand: brand ?? null,
      target_host: hostnameOf(url),
      url,
      almanac: Boolean(almanac_url),
    });
  };

  const spec = getBrand(brand);
  if (spec && brand) {
    return (
      <BrandButton
        brand={brand}
        href={href}
        label={title || spec.label}
        onClick={onClick}
        target="_blank"
        rel="noopener noreferrer"
      />
    );
  }

  return (
    <a
      data-testid="folio-link"
      href={href}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-center justify-between gap-3 border-[3px] border-foreground shadow-brutal transition-transform hover:-translate-y-0.5",
        CARD_PAD,
        highlight ? "bg-accent text-accent-foreground" : "bg-background hover:bg-secondary",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-foreground text-foreground shadow-brutal-sm sm:h-10 sm:w-10",
            highlight ? "bg-background" : "bg-secondary",
          )}
        >
          <img
            src={favicon_url ?? faviconProxyUrl(url)}
            alt=""
            width={18}
            height={18}
            loading="lazy"
            className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
          />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-base font-black sm:text-lg">{title || "링크"}</span>
          {description ? (
            <span className="mt-0.5 block line-clamp-2 text-xs opacity-80 sm:text-sm">
              {description}
            </span>
          ) : null}
        </span>
      </span>
      <span className="shrink-0 text-lg font-black transition-transform group-hover:translate-x-0.5 sm:text-xl">
        ↗
      </span>
    </a>
  );
}
