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
              // eslint-disable-next-line @next/next/no-img-element
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
    <section className="border-[4px] border-foreground bg-background p-5 shadow-brutal sm:p-7">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border-[4px] border-foreground bg-accent text-3xl font-black text-accent-foreground shadow-brutal sm:order-last sm:h-24 sm:w-24">
          {page.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.avatar_url}
              alt={page.display_name}
              className="h-full w-full object-cover"
            />
          ) : (
            initial || "F"
          )}
        </div>
        <div className="min-w-0 space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-accent sm:text-sm">
              @{page.slug}
            </p>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{page.display_name}</h1>
          </div>
          {page.description ? (
            <p className="text-sm leading-6 text-foreground/80 sm:text-base">{page.description}</p>
          ) : null}
          <SocialButtons socials={page.socials} />
        </div>
      </div>
    </section>
  );
}
