"use client";
// SPDX-License-Identifier: MIT

import type { EmailBlockData, ImageBlockData, PhoneBlockData } from "@folio/core";
import { telHref } from "@folio/core";
import { Mail, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { capture } from "@/lib/posthog-client";
import { cn } from "@/lib/utils";

/**
 * Tracked, clickable blocks (email/phone/image-with-href). Each fires a
 * `folio_link_click` event — the same standalone analytics path as `link`, with
 * a `kind` prop so PostHog funnels can split by block type.
 */

function track(params: {
  slug: string;
  blockId: string;
  kind: string;
  url: string;
  targetHost?: string | null;
}) {
  capture("folio_link_click", {
    slug: params.slug,
    block_id: params.blockId,
    brand: null,
    kind: params.kind,
    target_host: params.targetHost ?? null,
    url: params.url,
  });
}

/** Generic brutalist contact button shared by email + phone. */
function ContactButton({
  href,
  icon,
  title,
  description,
  onClick,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center justify-between gap-3 border-[3px] border-foreground bg-background p-3 shadow-brutal transition-transform hover:-translate-y-0.5 hover:bg-secondary sm:p-4",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-foreground bg-secondary text-foreground shadow-brutal-sm">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-base font-black sm:text-lg">{title}</span>
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

export function EmailBlock({ id, slug, data }: { id: string; slug: string; data: EmailBlockData }) {
  const domain = data.email.split("@")[1] ?? null;
  return (
    <ContactButton
      href={`mailto:${data.email}`}
      icon={<Mail className="h-4 w-4" aria-hidden="true" />}
      title={data.title || data.email}
      description={data.description}
      onClick={() =>
        track({ slug, blockId: id, kind: "email", url: `mailto:${data.email}`, targetHost: domain })
      }
    />
  );
}

export function PhoneBlock({ id, slug, data }: { id: string; slug: string; data: PhoneBlockData }) {
  const href = telHref(data.phone);
  return (
    <ContactButton
      href={href}
      icon={<Phone className="h-4 w-4" aria-hidden="true" />}
      title={data.title || data.phone}
      description={data.description}
      onClick={() => track({ slug, blockId: id, kind: "phone", url: href })}
    />
  );
}

export function ImageBlock({ id, slug, data }: { id: string; slug: string; data: ImageBlockData }) {
  const img = (
    <img
      src={data.url}
      alt={data.alt}
      loading="lazy"
      className="block w-full border-[3px] border-foreground shadow-brutal-sm"
    />
  );
  const href = data.href;
  if (!href) return img;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        track({ slug, blockId: id, kind: "image", url: href, targetHost: hostOf(href) })
      }
      className="block transition-transform hover:-translate-y-0.5"
    >
      {img}
    </a>
  );
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
