// SPDX-License-Identifier: MIT
import { ImageResponse } from "next/og";
import { OG_SIZE, renderOgImage } from "@/lib/og-image";
import { loadPublicPage } from "@/lib/public-page";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Folio";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await loadPublicPage(slug);
  if (!page) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFF7ED",
          fontSize: 80,
          fontWeight: 700,
          color: "#0a0a0a",
        }}
      >
        Folio
      </div>,
      OG_SIZE,
    );
  }
  return new ImageResponse(renderOgImage(page), OG_SIZE);
}
