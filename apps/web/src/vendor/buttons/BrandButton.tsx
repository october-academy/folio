// SPDX-License-Identifier: MIT
import type { AnchorHTMLAttributes } from "react";
import { BRANDS, type BrandSpec } from "./brands.generated";

export type BrandButtonProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  /** LittleLink brand key, e.g. "github", "x", "buy-me-a-coffee". */
  brand: string;
  href: string;
  /** Override the button text (defaults to the brand's label). */
  label?: string;
  /** Where the icon SVGs are served from. Defaults to "/brand-icons". */
  iconBasePath?: string;
};

/** Look up a brand spec, or undefined if the key is unknown. */
export function getBrand(key: string | undefined | null): BrandSpec | undefined {
  return key ? BRANDS[key] : undefined;
}

export function hasBrand(key: string | undefined | null): boolean {
  return !!key && key in BRANDS;
}

/**
 * Renders a LittleLink-style brand button. Color comes from `brands.css`
 * (the `.button.button-{brand}` cascade); the full-color icon and label come
 * from the generated manifest. Returns null for unknown brands so callers can
 * fall back to a generic link button.
 */
export function BrandButton({
  brand,
  href,
  label,
  iconBasePath = "/brand-icons",
  className,
  children,
  ...rest
}: BrandButtonProps) {
  const spec = BRANDS[brand];
  if (!spec) return null;

  const classes = ["button", `button-${brand}`, "folio-brand-button", className]
    .filter(Boolean)
    .join(" ");

  return (
    <a {...rest} href={href} className={classes}>
      <img
        className="icon"
        src={`${iconBasePath}/${spec.icon}.svg`}
        alt=""
        width={24}
        height={24}
        aria-hidden="true"
      />
      <span className="folio-brand-button__label">{label ?? children ?? spec.label}</span>
    </a>
  );
}
