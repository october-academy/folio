// SPDX-License-Identifier: MIT
import { customThemeStyle, type PublicFolioPage } from "@folio/core";
import type { CSSProperties } from "react";
import { BlockRenderer } from "./blocks";
import { FolioTracker } from "./FolioTracker";
import { ProfileHeader } from "./ProfileHeader";

function EmptyState() {
  return (
    <section className="border-[4px] border-dashed border-foreground bg-background px-6 py-12 text-center shadow-brutal-sm sm:py-16">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-accent">Folio</p>
      <h2 className="mt-2 text-xl font-black sm:text-2xl">아직 준비 중입니다</h2>
      <p className="mt-2 text-sm text-muted-foreground">곧 링크와 프로젝트를 정리해 둘게요.</p>
      <a
        href="https://github.com/october-academy/folio"
        target="_blank"
        rel="noopener noreferrer"
        className="folio-empty-cta mt-6"
      >
        Folio로 만들기 →
      </a>
    </section>
  );
}

function FolioFooter() {
  return (
    <footer className="pt-2 text-center">
      <a
        href="https://github.com/october-academy/folio"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-accent"
      >
        Made with Folio
      </a>
    </footer>
  );
}

export function FolioView({ page }: { page: PublicFolioPage }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: page.display_name,
      description: page.description || undefined,
      url: page.page_url,
      image: page.avatar_url ?? undefined,
      sameAs: page.socials.map((s) => s.url),
    },
    url: page.page_url,
  };
  const ldJson = JSON.stringify(jsonLd).replace(/</g, "\\u003c");
  const customStyle =
    page.theme === "custom" && page.custom_theme
      ? (customThemeStyle(page.custom_theme) as CSSProperties)
      : undefined;

  return (
    <main
      className={`theme-${page.theme} min-h-screen bg-secondary px-4 py-4 sm:py-8 lg:py-12`}
      style={customStyle}
    >
      <FolioTracker slug={page.slug} />
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is JSON.stringify'd and < is escaped to < */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson }} />
      <div className="mx-auto flex max-w-xl flex-col gap-3 sm:gap-5 lg:max-w-2xl lg:gap-8">
        <ProfileHeader page={page} />
        {page.blocks.length > 0 ? (
          <section className="flex flex-col gap-2.5 sm:gap-3 lg:gap-4">
            {page.blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} slug={page.slug} />
            ))}
          </section>
        ) : (
          <EmptyState />
        )}
        <FolioFooter />
      </div>
    </main>
  );
}
