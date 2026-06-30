// SPDX-License-Identifier: MIT
import type { PublicFolioPage } from "@folio/core";
import type { ReactElement } from "react";

/** OG card dimensions (1.91:1). */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

function initial(name: string): string {
  return (name.replace(/^@/, "").trim()[0] ?? "F").toUpperCase();
}

/**
 * The Folio OG card JSX, shared by the root and [slug] `opengraph-image` routes.
 * Uses the system font (next/og default) — no remote font fetch, which keeps it
 * working under OpenNext/Cloudflare where the route has no request origin.
 */
export function renderOgImage(page: PublicFolioPage): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#FFF7ED",
        padding: "40px",
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
    </div>
  );
}
