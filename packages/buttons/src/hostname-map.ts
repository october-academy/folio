// SPDX-License-Identifier: MIT
/**
 * URL → platform auto-detect — Folio's original feature (neither LittleLink nor
 * LinkStack does this). When a user pastes a link, map its hostname to a
 * LittleLink brand key so the right brand button is auto-assigned. Unknown hosts
 * fall back to a favicon (v0.2) / generic button.
 *
 * Every value here is a key that exists in `brands.generated.ts` (asserted in tests).
 */
const HOST_BRAND: Record<string, string> = {
  "github.com": "github",
  "gitlab.com": "gitlab",
  "x.com": "x",
  "twitter.com": "x",
  "instagram.com": "instagram",
  "youtube.com": "yt",
  "youtu.be": "yt",
  "linkedin.com": "linked",
  "facebook.com": "faceb",
  "fb.com": "faceb",
  "tiktok.com": "tiktok",
  "threads.net": "threads",
  "discord.gg": "discord",
  "discord.com": "discord",
  "t.me": "telegram",
  "telegram.me": "telegram",
  "open.spotify.com": "spotify",
  "spotify.com": "spotify",
  "soundcloud.com": "soundcloud",
  "twitch.tv": "twitch",
  "reddit.com": "reddit",
  "medium.com": "medium",
  "substack.com": "substack",
  "patreon.com": "patreon",
  "ko-fi.com": "ko-fi",
  "buymeacoffee.com": "coffee",
  "paypal.com": "paypal",
  "paypal.me": "paypal",
  "notion.so": "notion",
  "notion.site": "notion",
  "behance.net": "behance",
  "dribbble.com": "dribbble",
  "figma.com": "figma",
  "pinterest.com": "pinterest",
  "mastodon.social": "mastodon",
  "bsky.app": "bluesky",
  "snapchat.com": "snapchat",
  "wa.me": "whatsapp",
  "whatsapp.com": "whatsapp",
  "vimeo.com": "vimeo",
  "apps.apple.com": "appstore",
  "play.google.com": "playstore",
  "calendly.com": "calendly",
  "cal.com": "cal",
  "etsy.com": "etsy",
  "kickstarter.com": "kickstarter",
  "gofundme.com": "gofundme",
  "goodreads.com": "goodreads",
  "letterboxd.com": "letterboxd",
  "strava.com": "strava",
  "venmo.com": "venmo",
  "slack.com": "slack",
  "signal.me": "signal",
  "telegram.org": "telegram",
  "dev.to": "dev-to",
  "hashnode.com": "hashnode",
  "wordpress.com": "wordpress",
  "tumblr.com": "tumb",
  "flickr.com": "flickr",
  "unsplash.com": "unsplash",
  "producthunt.com": "product-hunt",
  "stackoverflow.com": "stack-overflow",
  "zoom.us": "zoom",
};

function hostnameOf(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Detect the LittleLink brand key for a URL, or undefined if unknown.
 * Matches the exact hostname, then walks up parent domains (e.g.
 * `m.youtube.com` → `youtube.com`).
 */
export function detectBrand(url: string): string | undefined {
  const host = hostnameOf(url);
  if (!host) return undefined;
  if (HOST_BRAND[host]) return HOST_BRAND[host];

  const parts = host.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join(".");
    const hit = HOST_BRAND[candidate];
    if (hit) return hit;
  }
  return undefined;
}

/** The full hostname→brand map (read-only), for tests / introspection. */
export const HOSTNAME_BRAND_MAP: Readonly<Record<string, string>> = HOST_BRAND;
