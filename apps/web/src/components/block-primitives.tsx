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
import { ContactRound, Play, Sparkles } from "lucide-react";
import { qrModules, qrSvgPath } from "@/lib/qr";
import { CARD_PAD, ICON_CHIP } from "./block-chrome";

/** Static (server-renderable) block renderers — no client/tracking deps. */

export function HeadingBlock({ data }: { data: HeadingBlockData }) {
  return (
    <div className="px-1 pt-4 sm:pt-5">
      <h2 className="text-base font-black uppercase tracking-wide text-foreground sm:text-lg">
        {data.text}
      </h2>
      <div className="mt-1.5 h-[3px] w-10 bg-accent sm:w-12" aria-hidden="true" />
    </div>
  );
}

export function TextBlock({ data }: { data: TextBlockData }) {
  return (
    <div className="border-[3px] border-foreground bg-background p-3 shadow-brutal-sm sm:p-4 lg:p-5">
      <p className="whitespace-pre-wrap text-sm leading-6 text-foreground sm:text-base sm:leading-7">
        {data.text}
      </p>
    </div>
  );
}

export function DividerBlock({ data }: { data: DividerBlockData }) {
  const gap = data.size === "lg" ? "py-5" : data.size === "sm" ? "py-1.5" : "py-3";
  return (
    <div className={`flex items-center gap-3 px-1 ${gap}`} aria-hidden="true">
      <div className="h-[3px] flex-1 bg-foreground/25" />
      <span className="inline-flex h-7 w-7 items-center justify-center border-[3px] border-foreground bg-accent text-accent-foreground shadow-brutal-sm">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div className="h-[3px] flex-1 bg-foreground/25" />
    </div>
  );
}

/**
 * Privacy-friendly YouTube embed (youtube-nocookie). No tracking — the iframe is
 * inert until the visitor presses play, and YouTube's own cookies are deferred.
 */
export function YouTubeBlock({ data }: { data: YouTubeBlockData }) {
  return (
    <figure className="overflow-hidden border-[3px] border-foreground bg-background shadow-brutal">
      {data.title ? (
        <figcaption className="flex items-center gap-2 border-b-[3px] border-foreground px-3 py-2">
          <span className="inline-flex h-7 w-7 items-center justify-center border-[3px] border-foreground bg-accent text-accent-foreground shadow-brutal-sm">
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="truncate text-sm font-bold text-foreground sm:text-base">
            {data.title}
          </span>
        </figcaption>
      ) : null}
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
      className={`group flex items-center justify-between gap-3 border-[3px] border-foreground bg-background shadow-brutal transition-transform hover:-translate-y-0.5 hover:bg-secondary ${CARD_PAD}`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className={`${ICON_CHIP} bg-accent text-accent-foreground`}>
          <ContactRound className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
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
      <span className="text-lg font-black transition-transform group-hover:translate-y-0.5 sm:text-xl">
        ↓
      </span>
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
    <figure className="flex flex-col items-center gap-3 border-[3px] border-foreground bg-background p-4 shadow-brutal-sm sm:p-5">
      {/* Inner white quiet-zone frame keeps the matrix scannable on any theme. */}
      <div className="border-[3px] border-foreground bg-white p-2 shadow-brutal-sm">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={200}
          height={200}
          role="img"
          aria-label={data.caption ? `QR: ${data.caption}` : `QR code for ${data.target}`}
          shapeRendering="crispEdges"
          className="h-auto w-full max-w-[180px] sm:max-w-[200px]"
        >
          <rect width={size} height={size} fill="#ffffff" />
          <path d={path} transform={`translate(${quiet} ${quiet})`} fill="#000000" />
        </svg>
      </div>
      {data.caption ? (
        <figcaption className="text-center text-sm font-bold text-foreground">
          {data.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
