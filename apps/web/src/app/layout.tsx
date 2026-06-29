// SPDX-License-Identifier: MIT
import type { Metadata } from "next";
import { PostHogInit } from "@/components/PostHogInit";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Folio",
    template: "%s · Folio",
  },
  description: "Your link-in-bio, with attribution. Open source, on Cloudflare + PostHog.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PostHogInit />
        {children}
      </body>
    </html>
  );
}
