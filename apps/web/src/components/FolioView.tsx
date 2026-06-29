// SPDX-License-Identifier: MIT
import type { PublicFolioPage } from "@folio/core";
import { BlockRenderer } from "./blocks";
import { FolioTracker } from "./FolioTracker";
import { ProfileHeader } from "./ProfileHeader";

function EmptyState() {
  return (
    <section className="border-[4px] border-dashed border-foreground bg-background px-6 py-12 text-center shadow-brutal-sm">
      <h2 className="text-xl font-black">아직 준비 중입니다</h2>
      <p className="mt-2 text-sm text-muted-foreground">곧 링크와 프로젝트를 정리해 둘게요.</p>
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

  return (
    <main className={`theme-${page.theme} min-h-screen bg-secondary px-4 py-8 sm:py-12`}>
      <FolioTracker slug={page.slug} />
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is JSON.stringify'd and < is escaped to < */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson }} />
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        <ProfileHeader page={page} />
        {page.blocks.length > 0 ? (
          <section className="flex flex-col gap-3">
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
