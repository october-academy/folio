// SPDX-License-Identifier: MIT
import { getBrand } from "@folio/buttons";
import type { PublicFolioPage } from "@folio/core";
import { Link2 } from "lucide-react";

function SocialButtons({ socials }: { socials: PublicFolioPage["socials"] }) {
  if (socials.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
      {socials.map((social) => {
        const spec = getBrand(social.brand);
        return (
          <a
            key={`${social.brand}-${social.url}`}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={spec?.label ?? social.brand}
            className={`button button-${social.brand} folio-social`}
          >
            {spec ? (
              <img
                className="icon"
                src={`/brand-icons/${spec.icon}.svg`}
                alt=""
                width={20}
                height={20}
                aria-hidden="true"
              />
            ) : (
              <Link2 className="h-5 w-5" aria-hidden="true" />
            )}
          </a>
        );
      })}
    </div>
  );
}

export function ProfileHeader({ page }: { page: PublicFolioPage }) {
  const initial = page.display_name.replace(/^@/, "").charAt(0).toUpperCase();
  return (
    <section className="border-[4px] border-foreground bg-background p-4 shadow-brutal sm:p-6 lg:p-8">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:text-left">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border-[4px] border-foreground bg-accent text-2xl font-black text-accent-foreground shadow-brutal-sm sm:order-last sm:h-20 sm:w-20 sm:shadow-brutal lg:h-28 lg:w-28 lg:text-3xl">
          {page.avatar_url ? (
            <img
              src={page.avatar_url}
              alt={page.display_name}
              className="h-full w-full object-cover"
            />
          ) : (
            initial || "F"
          )}
        </div>
        <div className="min-w-0 space-y-2 sm:space-y-3 lg:space-y-4">
          <div className="space-y-1 lg:space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-accent sm:text-sm">
              @{page.slug}
            </p>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              {page.display_name}
            </h1>
          </div>
          {page.description ? (
            <p className="line-clamp-2 text-sm leading-6 text-foreground/80 sm:line-clamp-none sm:max-w-xl sm:text-base sm:leading-7">
              {page.description}
            </p>
          ) : null}
          <SocialButtons socials={page.socials} />
        </div>
      </div>
    </section>
  );
}
