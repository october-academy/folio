import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // @folio/core and @folio/buttons are consumed as TypeScript source.
  transpilePackages: ["@folio/core", "@folio/buttons"],

  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      // favicons + user avatars + brand icons are remote/data images
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      `connect-src 'self' ${posthogHost} https://us-assets.i.posthog.com https://eu.i.posthog.com`,
      "frame-src 'self' https://www.youtube.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      // Canonical /@slug → the [slug] route.
      { source: "/@:slug", destination: "/:slug" },
      // PostHog reverse-proxy (ad-blocker resilience), mirroring the standard setup.
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      { source: "/ingest/:path*", destination: `${posthogHost}/:path*` },
    ];
  },
};

// Enables getCloudflareContext() (D1/KV bindings) during `next dev`.
initOpenNextCloudflareForDev();

export default nextConfig;
