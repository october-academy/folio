import { defineCloudflareConfig, type OpenNextConfig } from "@opennextjs/cloudflare/config";

const cloudflareConfig = defineCloudflareConfig({});
const splitFunctionOverride =
  cloudflareConfig.middleware && "override" in cloudflareConfig.middleware
    ? cloudflareConfig.middleware.override
    : undefined;

export default {
  ...cloudflareConfig,
  // OG images run as an edge function (Satori). Mirrors the Agentic30 setup.
  functions: {
    ogImages: {
      runtime: "edge",
      override: splitFunctionOverride,
      routes: ["app/api/og/[slug]/route"],
      patterns: ["/api/og/*"],
    },
  },
} satisfies OpenNextConfig;
