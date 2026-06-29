// SPDX-License-Identifier: MIT
import { ImageResponse } from "next/og";
import { loadPublicPage } from "@/lib/public-page";

export const runtime = "edge";

const SIZE = { width: 1200, height: 630 };

let fontCache: ArrayBuffer | null = null;
async function loadFont(origin: string): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  const res = await fetch(`${origin}/fonts/og.ttf`);
  fontCache = await res.arrayBuffer();
  return fontCache;
}

function initial(name: string): string {
  return (name.replace(/^@/, "").trim()[0] ?? "F").toUpperCase();
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const page = await loadPublicPage(slug);
    if (!page) return new Response("Not Found", { status: 404 });

    const origin = new URL(request.url).origin;
    const font = await loadFont(origin);

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#FFF7ED",
          padding: "40px",
          fontFamily: "Roboto",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "4px solid #0a0a0a",
            background: "#ffffff",
            boxShadow: "14px 14px 0 #FF6B35",
            padding: "48px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "32px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
              <div style={{ display: "flex", fontSize: "26px", color: "#FF6B35", fontWeight: 700 }}>
                @{page.slug}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: page.display_name.length > 18 ? "60px" : "72px",
                  fontWeight: 700,
                  lineHeight: 1.05,
                  color: "#0a0a0a",
                }}
              >
                {page.display_name}
              </div>
              {page.description ? (
                <div
                  style={{
                    display: "flex",
                    fontSize: "30px",
                    color: "#525252",
                    lineHeight: 1.35,
                    maxWidth: "720px",
                  }}
                >
                  {page.description.slice(0, 120)}
                </div>
              ) : null}
            </div>
            <div
              style={{
                display: "flex",
                width: "180px",
                height: "180px",
                border: "4px solid #0a0a0a",
                background: page.avatar_url ? "#e5e5e5" : "#FF6B35",
                boxShadow: "10px 10px 0 #0a0a0a",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
                color: "#ffffff",
                fontSize: "88px",
                fontWeight: 700,
              }}
            >
              {page.avatar_url ? (
                <img
                  src={page.avatar_url}
                  width={180}
                  height={180}
                  alt=""
                  style={{ width: "180px", height: "180px", objectFit: "cover" }}
                />
              ) : (
                initial(page.display_name)
              )}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "4px solid #0a0a0a",
              paddingTop: "26px",
              fontSize: "26px",
              color: "#0a0a0a",
              fontWeight: 700,
            }}
          >
            <div style={{ display: "flex" }}>Folio</div>
            <div style={{ display: "flex", color: "#FF6B35" }}>
              {page.page_url.replace(/^https?:\/\//, "")}
            </div>
          </div>
        </div>
      </div>,
      {
        ...SIZE,
        fonts: [{ name: "Roboto", data: font, weight: 700, style: "normal" }],
        headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
      },
    );
  } catch (error) {
    console.error("[og] render failed", error);
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
