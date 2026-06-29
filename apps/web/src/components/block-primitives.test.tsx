import { describe, expect, test } from "bun:test";
import { BrandButton } from "@folio/buttons";
import { renderToStaticMarkup } from "react-dom/server";
import { DividerBlock, HeadingBlock, TextBlock } from "./block-primitives";

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
