"use client";

import { getBrand } from "@folio/buttons";
import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditorBlock, SocialDraft } from "./editor-helpers";

function BrandChip({ brand, label }: { brand: string; label: string }) {
  const spec = getBrand(brand);
  return (
    <span className={`button button-${brand} folio-brand-button`}>
      {spec ? (
        <img className="icon" src={`/brand-icons/${spec.icon}.svg`} alt="" width={20} height={20} />
      ) : (
        <Link2 className="h-5 w-5" />
      )}
      <span className="folio-brand-button__label truncate">{label}</span>
    </span>
  );
}

function PreviewBlock({ block }: { block: EditorBlock }) {
  const d = block.data;
  if (block.type === "heading") {
    return (
      <p className="px-1 pt-2 text-sm font-black uppercase tracking-wide text-foreground/75">
        {String(d.text ?? "헤딩")}
      </p>
    );
  }
  if (block.type === "text") {
    return (
      <div className="border-[3px] border-foreground bg-background p-3 text-xs shadow-brutal-sm">
        {String(d.text ?? "텍스트")}
      </div>
    );
  }
  if (block.type === "divider") {
    return (
      <div className="flex items-center gap-2 py-1">
        <div className="h-[3px] flex-1 bg-foreground/30" />
        <div className="h-2 w-2 rotate-45 border-[3px] border-foreground bg-accent" />
        <div className="h-[3px] flex-1 bg-foreground/30" />
      </div>
    );
  }
  // link
  const brand = typeof d.brand === "string" ? d.brand : "";
  const title = String(d.title || "링크");
  if (brand && getBrand(brand)) {
    return <BrandChip brand={brand} label={title} />;
  }
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-[3px] border-foreground p-2.5 text-xs font-black shadow-brutal-sm",
        d.highlight ? "bg-accent text-accent-foreground" : "bg-background",
      )}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center border-[3px] border-foreground bg-secondary">
        <Link2 className="h-3.5 w-3.5" />
      </span>
      <span className="truncate">{title}</span>
    </div>
  );
}

export function LivePreview({
  displayName,
  slug,
  description,
  avatarUrl,
  theme,
  socials,
  blocks,
}: {
  displayName: string;
  slug: string;
  description: string;
  avatarUrl: string;
  theme: string;
  socials: SocialDraft[];
  blocks: EditorBlock[];
}) {
  const visible = blocks.filter((b) => b.is_visible);
  const initial = (displayName || "F").trim().charAt(0).toUpperCase();
  return (
    <aside className="xl:sticky xl:top-6 xl:self-start">
      <div className="mb-3 border-[3px] border-foreground bg-foreground px-3 py-2 text-xs font-black uppercase tracking-wide text-background">
        실시간 미리보기
      </div>
      <div
        className={cn(
          `theme-${theme}`,
          "mx-auto w-full max-w-[360px] border-[4px] border-foreground bg-secondary p-4 shadow-brutal",
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden border-[3px] border-foreground bg-accent text-2xl font-black text-accent-foreground shadow-brutal-sm">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
              @{slug || "your-slug"}
            </p>
            <p className="mt-1 text-lg font-black text-foreground">{displayName || "Your Name"}</p>
            {description ? <p className="mt-1 text-xs text-foreground/70">{description}</p> : null}
          </div>
          {socials.filter((s) => s.url.trim()).length > 0 ? (
            <div className="flex flex-wrap justify-center gap-1.5">
              {socials
                .filter((s) => s.url.trim() && s.brand)
                .map((s) => {
                  const spec = getBrand(s.brand);
                  return (
                    <span
                      key={`${s.brand}-${s.url}`}
                      className={`button button-${s.brand} folio-social`}
                      style={{ width: 36, height: 36 }}
                    >
                      {spec ? (
                        <img
                          className="icon"
                          src={`/brand-icons/${spec.icon}.svg`}
                          alt=""
                          width={16}
                          height={16}
                        />
                      ) : (
                        <Link2 className="h-4 w-4" />
                      )}
                    </span>
                  );
                })}
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {visible.length > 0 ? (
            visible.map((block) => <PreviewBlock key={block.id} block={block} />)
          ) : (
            <p className="border-[3px] border-dashed border-foreground bg-background px-3 py-6 text-center text-xs text-muted-foreground">
              블록을 추가하면 여기에 표시됩니다.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
