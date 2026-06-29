import type { DividerBlockData, HeadingBlockData, TextBlockData } from "@folio/core";

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
