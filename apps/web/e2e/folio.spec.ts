// SPDX-License-Identifier: MIT
import { expect, test } from "@playwright/test";

/**
 * v0.1 acceptance (SPEC §17): create page → add a link block → publish →
 * `/@slug` renders the brand button → clicking fires `folio_link_click`.
 *
 * Requires a running dev server with FOLIO_ADMIN_TOKEN set (see playwright.config.ts).
 */
const ADMIN_TOKEN = process.env.FOLIO_ADMIN_TOKEN ?? "test-admin-token";

test("create link → publish → brand button renders → click fires folio_link_click", async ({
  page,
  context,
}) => {
  // Capture every PostHog event sent through the /ingest reverse-proxy.
  const ingestBodies: string[] = [];
  await context.route("**/ingest/**", async (route) => {
    const body = route.request().postData() ?? "";
    if (body) ingestBodies.push(body);
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  // Seed the admin token so the editor loads past its token gate.
  await context.addInitScript((token) => {
    window.localStorage.setItem("folio_admin_token", token);
  }, ADMIN_TOKEN);

  // 1. Open the editor and add a GitHub link block (brand auto-detected from URL).
  await page.goto("/admin");
  await page.getByTestId("add-block").click();
  await page.getByTestId("block-url").fill("https://github.com/october-academy");
  await page.getByTestId("block-title").fill("My GitHub");
  await page.getByTestId("block-save").click();

  // The editor reloads from the server after a successful save.
  await expect(page.getByTestId("block-url")).toHaveValue(/github\.com/, {
    timeout: 10_000,
  });

  // 2. The public page renders the LittleLink brand button for GitHub.
  await page.goto("/");
  const brandButton = page.locator("a.folio-brand-button.button-github");
  await expect(brandButton).toBeVisible();
  await expect(brandButton).toContainText("My GitHub");

  // 3. Clicking the link fires a folio_link_click PostHog event.
  await brandButton.click();
  await expect
    .poll(() => ingestBodies.some((b) => b.includes("folio_link_click")), {
      timeout: 5_000,
    })
    .toBe(true);
});
