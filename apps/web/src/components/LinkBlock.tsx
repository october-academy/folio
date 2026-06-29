"use client";
// SPDX-License-Identifier: MIT

import { BrandButton, getBrand } from "@folio/buttons";
import { hostnameOf, type LinkBlockData } from "@folio/core";
import { faviconProxyUrl } from "@/lib/favicon-util";
import { capture } from "@/lib/posthog-client";
import { cn } from "@/lib/utils";

/**
 * A link block on the public page. Fires `folio_link_click` on click
 * (standalone analytics path). Renders a LittleLink brand button when the link
 * has a known brand, otherwise a brutalist favicon/generic button.
 */
export function LinkBlock({ id, slug, data }: { id: string; slug: string; data: LinkBlockData }) {
  const { url, title, brand, favicon_url, description, highlight } = data;

  const onClick = () => {
    capture("folio_link_click", {
      slug,
      block_id: id,
      brand: brand ?? null,
      target_host: hostnameOf(url),
      url,
    });
  };

  const spec = getBrand(brand);
  if (spec && brand) {
    return (
      <BrandButton
        brand={brand}
        href={url}
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
      href={url}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-center justify-between gap-3 border-[3px] border-foreground p-3 shadow-brutal transition-transform hover:-translate-y-0.5 sm:p-4",
        highlight ? "bg-accent text-accent-foreground" : "bg-background hover:bg-secondary",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-foreground bg-secondary text-foreground shadow-brutal-sm">
          <img
            src={favicon_url ?? faviconProxyUrl(url)}
            alt=""
            width={18}
            height={18}
            loading="lazy"
            className="h-[18px] w-[18px]"
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
      <span className="text-lg font-black transition-transform group-hover:translate-x-0.5 sm:text-xl">
        ↗
      </span>
    </a>
  );
}
