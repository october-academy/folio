"use client";
// SPDX-License-Identifier: MIT

import { getBrand } from "@folio/buttons";
import { customThemeStyle, extractYouTubeId, normalizeCustomTheme } from "@folio/core";
import { ContactRound, Link2, Mail, Phone, Play, QrCode } from "lucide-react";
import type { CSSProperties } from "react";
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
  if (block.type === "email" || block.type === "phone") {
    const isEmail = block.type === "email";
    const label = String(d.title || (isEmail ? d.email : d.phone) || (isEmail ? "이메일" : "전화"));
    return (
      <div className="flex items-center gap-2 border-[3px] border-foreground bg-background p-2.5 text-xs font-black shadow-brutal-sm">
        <span className="inline-flex h-7 w-7 items-center justify-center border-[3px] border-foreground bg-secondary">
          {isEmail ? <Mail className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
        </span>
        <span className="truncate">{label}</span>
      </div>
    );
  }
  if (block.type === "image") {
    const url = String(d.url ?? "");
    return url && url !== "https://" ? (
      <img
        src={url}
        alt={String(d.alt ?? "")}
        className="block w-full border-[3px] border-foreground shadow-brutal-sm"
      />
    ) : (
      <div className="border-[3px] border-dashed border-foreground bg-background px-3 py-6 text-center text-xs text-muted-foreground">
        이미지 URL을 입력하세요
      </div>
    );
  }
  if (block.type === "youtube") {
    const id = extractYouTubeId(String(d.video_id ?? ""));
    return (
      <div className="flex items-center gap-2 border-[3px] border-foreground bg-background p-2.5 text-xs font-black shadow-brutal-sm">
        <span className="inline-flex h-7 w-7 items-center justify-center border-[3px] border-foreground bg-accent text-accent-foreground">
          <Play className="h-3.5 w-3.5" />
        </span>
        <span className="truncate">
          {String(d.title || (id ? "YouTube 영상" : "YouTube 링크 입력"))}
        </span>
      </div>
    );
  }
  if (block.type === "vcard") {
    return (
      <div className="flex items-center gap-2 border-[3px] border-foreground bg-background p-2.5 text-xs font-black shadow-brutal-sm">
        <span className="inline-flex h-7 w-7 items-center justify-center border-[3px] border-foreground bg-accent text-accent-foreground">
          <ContactRound className="h-3.5 w-3.5" />
        </span>
        <span className="truncate">{String(d.label || d.name || "연락처")}</span>
      </div>
    );
  }
  if (block.type === "qr") {
    return (
      <div className="flex flex-col items-center gap-1 border-[3px] border-foreground bg-background p-3 shadow-brutal-sm">
        <QrCode className="h-16 w-16 text-foreground" />
        {d.caption ? <span className="truncate text-xs font-bold">{String(d.caption)}</span> : null}
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
  customTheme,
  socials,
  blocks,
}: {
  displayName: string;
  slug: string;
  description: string;
  avatarUrl: string;
  theme: string;
  customTheme?: Record<string, string>;
  socials: SocialDraft[];
  blocks: EditorBlock[];
}) {
  const visible = blocks.filter((b) => b.is_visible);
  const initial = (displayName || "F").trim().charAt(0).toUpperCase();
  const customStyle =
    theme === "custom" && customTheme
      ? (customThemeStyle(normalizeCustomTheme(customTheme)) as CSSProperties)
      : undefined;
  return (
    <aside className="xl:sticky xl:top-6 xl:self-start">
      <div className="mb-3 flex items-center gap-2 border-[3px] border-foreground bg-foreground px-3 py-2 text-xs font-black uppercase tracking-wide text-background">
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden="true" />
        실시간 미리보기
      </div>
      {/* Phone chassis — the device shell (no theme class). */}
      <div className="mx-auto w-full max-w-[340px] rounded-[40px] border-[4px] border-foreground bg-foreground p-2.5 shadow-brutal sm:max-w-[360px]">
        {/* Inner screen carries the theme + custom palette → re-themes live, exactly
            like the real public page (bg-background, not the editor's bg-secondary). */}
        <div
          className={cn(
            `theme-${theme}`,
            "relative overflow-hidden rounded-[30px] border-[3px] border-foreground bg-background",
          )}
          style={customStyle}
        >
          <div className="flex items-center justify-center pt-2.5" aria-hidden="true">
            <div className="h-1.5 w-16 rounded-full bg-foreground/30" />
          </div>
          <div className="max-h-[560px] overflow-y-auto px-4 pb-5 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="border-[3px] border-foreground bg-background p-3 text-center shadow-brutal-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden border-[3px] border-foreground bg-accent text-xl font-black text-accent-foreground shadow-brutal-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                @{slug || "your-slug"}
              </p>
              <p className="mt-0.5 text-base font-black text-foreground">
                {displayName || "Your Name"}
              </p>
              {description ? (
                <p className="mt-1 text-xs text-foreground/70">{description}</p>
              ) : null}
              {socials.filter((s) => s.url.trim()).length > 0 ? (
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {socials
                    .filter((s) => s.url.trim() && s.brand)
                    .map((s) => {
                      const spec = getBrand(s.brand);
                      return (
                        <span
                          key={`${s.brand}-${s.url}`}
                          title={spec?.label ?? s.brand}
                          className={`button button-${s.brand} folio-social`}
                          style={{ width: 34, height: 34 }}
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
            <div className="mt-3 flex flex-col gap-2">
              {visible.length > 0 ? (
                visible.map((block) => <PreviewBlock key={block.id} block={block} />)
              ) : (
                <p className="border-[3px] border-dashed border-foreground bg-background px-3 py-6 text-center text-xs text-muted-foreground">
                  블록을 추가하면 여기에 표시됩니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
