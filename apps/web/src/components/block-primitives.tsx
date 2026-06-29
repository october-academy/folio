// SPDX-License-Identifier: MIT
import type {
  DividerBlockData,
  HeadingBlockData,
  QRBlockData,
  TextBlockData,
  VCardBlockData,
  YouTubeBlockData,
} from "@folio/core";
import { vcardDataUri, vcardFilename } from "@folio/core";
import { ContactRound } from "lucide-react";
import { qrModules, qrSvgPath } from "@/lib/qr";

/** Static (server-renderable) block renderers — no client/tracking deps. */

export function HeadingBlock({ data }: { data: HeadingBlockData }) {
  return (
    <h2 className="px-1 pt-3 text-base font-black uppercase tracking-wide text-foreground/75 sm:text-lg">
      {data.text}
    </h2>
  );
}

export function TextBlock({ data }: { data: TextBlockData }) {
  return (
    <div className="border-[3px] border-foreground bg-background p-3 shadow-brutal-sm sm:p-4">
      <p className="whitespace-pre-wrap text-sm leading-6 text-foreground sm:text-base">
        {data.text}
      </p>
    </div>
  );
}

export function DividerBlock({ data }: { data: DividerBlockData }) {
  const gap = data.size === "lg" ? "py-4" : data.size === "sm" ? "py-1" : "py-2";
  return (
    <div className={`flex items-center gap-3 px-1 ${gap}`} aria-hidden="true">
      <div className="h-[3px] flex-1 bg-foreground/30" />
      <div className="h-2 w-2 rotate-45 border-[3px] border-foreground bg-accent" />
      <div className="h-[3px] flex-1 bg-foreground/30" />
    </div>
  );
}

/**
 * Privacy-friendly YouTube embed (youtube-nocookie). No tracking — the iframe is
 * inert until the visitor presses play, and YouTube's own cookies are deferred.
 */
export function YouTubeBlock({ data }: { data: YouTubeBlockData }) {
  return (
    <figure className="overflow-hidden border-[3px] border-foreground bg-background shadow-brutal-sm">
      <div className="aspect-video w-full">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${data.video_id}`}
          title={data.title || "YouTube video"}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      {data.title ? (
        <figcaption className="border-t-[3px] border-foreground px-3 py-2 text-sm font-bold text-foreground">
          {data.title}
        </figcaption>
      ) : null}
    </figure>
  );
}

/**
 * "Save contact" button. Serves a downloadable vCard via a `data:` URI — no
 * extra route and no client JS required.
 */
export function VCardBlock({ data }: { data: VCardBlockData }) {
  const subtitle = [data.role, data.org].filter(Boolean).join(" · ");
  return (
    <a
      href={vcardDataUri(data)}
      download={vcardFilename(data)}
      className="group flex items-center justify-between gap-3 border-[3px] border-foreground bg-background p-3 shadow-brutal transition-transform hover:-translate-y-0.5 hover:bg-secondary sm:p-4"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-foreground bg-accent text-accent-foreground shadow-brutal-sm">
          <ContactRound className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-base font-black sm:text-lg">
            {data.label || data.name}
          </span>
          {subtitle ? (
            <span className="mt-0.5 block truncate text-xs opacity-80 sm:text-sm">{subtitle}</span>
          ) : null}
        </span>
      </span>
      <span className="text-lg font-black sm:text-xl">↓</span>
    </a>
  );
}

/**
 * QR code for a link/page. Rendered as inline SVG at SSR time. The QR itself is
 * always black-on-white (regardless of theme) so phone cameras can scan it; the
 * brutalist frame around it follows the theme.
 */
export function QRBlock({ data }: { data: QRBlockData }) {
  const modules = qrModules(data.target);
  const n = modules.length;
  const quiet = 2; // mandatory quiet zone (in modules)
  const size = n + quiet * 2;
  const path = qrSvgPath(modules);
  return (
    <figure className="flex flex-col items-center gap-2 border-[3px] border-foreground bg-background p-4 shadow-brutal-sm">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={200}
        height={200}
        role="img"
        aria-label={data.caption ? `QR: ${data.caption}` : `QR code for ${data.target}`}
        shapeRendering="crispEdges"
        className="h-auto w-full max-w-[200px] border-[3px] border-foreground"
      >
        <rect width={size} height={size} fill="#ffffff" />
        <path d={path} transform={`translate(${quiet} ${quiet})`} fill="#000000" />
      </svg>
      {data.caption ? (
        <figcaption className="text-center text-sm font-bold text-foreground">
          {data.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
