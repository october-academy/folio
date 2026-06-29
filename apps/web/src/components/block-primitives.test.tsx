// SPDX-License-Identifier: MIT
import { describe, expect, test } from "bun:test";
import { BrandButton } from "@folio/buttons";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DividerBlock,
  HeadingBlock,
  QRBlock,
  TextBlock,
  VCardBlock,
  YouTubeBlock,
} from "./block-primitives";

describe("block primitives render", () => {
  test("heading renders its text inside an h2", () => {
    const html = renderToStaticMarkup(<HeadingBlock data={{ text: "My Links" }} />);
    expect(html).toContain("<h2");
    expect(html).toContain("My Links");
  });

  test("text renders its content", () => {
    const html = renderToStaticMarkup(<TextBlock data={{ text: "hello world" }} />);
    expect(html).toContain("hello world");
  });

  test("divider applies the size gap", () => {
    expect(renderToStaticMarkup(<DividerBlock data={{ size: "lg" }} />)).toContain("py-4");
    expect(renderToStaticMarkup(<DividerBlock data={{}} />)).toContain("py-2");
  });

  test("youtube embeds the nocookie player and an optional caption", () => {
    const html = renderToStaticMarkup(
      <YouTubeBlock data={{ video_id: "dQw4w9WgXcQ", title: "My talk" }} />,
    );
    expect(html).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(html).toContain("My talk");
    // No naked youtube.com (privacy: only the nocookie host).
    expect(html).not.toContain("//www.youtube.com");
  });

  test("vcard renders a downloadable data: link with the label", () => {
    const html = renderToStaticMarkup(
      <VCardBlock data={{ name: "Hogyun Yu", label: "연락처 저장", org: "October" }} />,
    );
    expect(html).toContain('href="data:text/vcard');
    expect(html).toContain('download="hogyun-yu.vcf"');
    expect(html).toContain("연락처 저장");
  });

  test("qr renders an inline svg (black-on-white) with a caption", () => {
    const html = renderToStaticMarkup(
      <QRBlock data={{ target: "https://folio.example/@me", caption: "스캔하세요" }} />,
    );
    expect(html).toContain("<svg");
    expect(html).toContain('fill="#ffffff"'); // white background (scannable)
    expect(html).toContain('fill="#000000"'); // black modules
    expect(html).toContain("스캔하세요");
  });
});

describe("brand button render (link path)", () => {
  test("a known brand renders the LittleLink button + icon + label", () => {
    const html = renderToStaticMarkup(<BrandButton brand="github" href="https://github.com/x" />);
    expect(html).toContain("button-github");
    expect(html).toContain("/brand-icons/github.svg");
    expect(html).toContain("GitHub");
  });

  test("an explicit label overrides the brand label", () => {
    const html = renderToStaticMarkup(
      <BrandButton brand="github" href="https://github.com/x" label="My Code" />,
    );
    expect(html).toContain("My Code");
  });

  test("an unknown brand renders nothing (caller falls back)", () => {
    const html = renderToStaticMarkup(<BrandButton brand="zzz-not-a-brand" href="https://x.com" />);
    expect(html).toBe("");
  });
});
