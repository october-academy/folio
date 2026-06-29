// SPDX-License-Identifier: MIT
/**
 * Shared neo-brutalist block chrome — plain class strings, no components, so both
 * server (block-primitives) and client (LinkBlock/tracked-blocks) import cleanly
 * without crossing the RSC boundary.
 */

/** Interactive card: lifts on hover/focus, full brutal shadow. */
export const CARD_INTERACTIVE =
  "group block border-[3px] border-foreground shadow-brutal transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5";

/** Responsive padding scale for padded cards. */
export const CARD_PAD = "p-3 sm:p-4 lg:p-5";

/** Square icon chip that fronts a block. */
export const ICON_CHIP =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-foreground shadow-brutal-sm sm:h-10 sm:w-10";
