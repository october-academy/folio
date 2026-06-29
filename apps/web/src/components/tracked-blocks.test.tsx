// SPDX-License-Identifier: MIT
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { EmailBlock, ImageBlock, PhoneBlock } from "./tracked-blocks";

describe("tracked blocks render", () => {
  test("email renders a mailto link with title fallback", () => {
    const html = renderToStaticMarkup(
      <EmailBlock id="b1" slug="me" data={{ email: "hi@folio.dev", title: "Email me" }} />,
    );
    expect(html).toContain('href="mailto:hi@folio.dev"');
    expect(html).toContain("Email me");
  });

  test("phone renders a dialable tel link (separators stripped in href)", () => {
    const html = renderToStaticMarkup(
      <PhoneBlock id="b2" slug="me" data={{ phone: "+82 (10) 1234-5678", title: "Call" }} />,
    );
    expect(html).toContain('href="tel:+821012345678"');
    expect(html).toContain("Call");
  });

  test("image without href renders a bare <img>", () => {
    const html = renderToStaticMarkup(
      <ImageBlock id="b3" slug="me" data={{ url: "https://img.test/a.png", alt: "Banner" }} />,
    );
    expect(html).toContain('src="https://img.test/a.png"');
    expect(html).toContain('alt="Banner"');
    expect(html).not.toContain("<a");
  });

  test("image with href wraps the img in a tracked anchor", () => {
    const html = renderToStaticMarkup(
      <ImageBlock
        id="b4"
        slug="me"
        data={{ url: "https://img.test/a.png", alt: "Banner", href: "https://shop.test/sale" }}
      />,
    );
    expect(html).toContain('href="https://shop.test/sale"');
    expect(html).toContain('src="https://img.test/a.png"');
  });
});
