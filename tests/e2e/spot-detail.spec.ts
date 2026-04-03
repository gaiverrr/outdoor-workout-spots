import { test, expect } from "@playwright/test";

test.describe("Spot Detail", () => {
  test("detail page renders spot title", async ({ page }) => {
    await page.goto("/spots/1");
    const title = page.getByTestId("spot-title");
    await expect(title).toBeVisible({ timeout: 10000 });
    await expect(title).not.toBeEmpty();
  });

  test("back button is present", async ({ page }) => {
    await page.goto("/spots/1");
    const back = page.getByTestId("back-button");
    await expect(back).toBeVisible();
  });

  test("share button is present", async ({ page }) => {
    await page.goto("/spots/1");
    const share = page.getByTestId("share-button");
    await expect(share).toBeVisible();
  });

  test("Google Maps link has correct URL", async ({ page }) => {
    await page.goto("/spots/1");
    const link = page.getByTestId("open-google-maps");
    if (await link.isVisible()) {
      const href = await link.getAttribute("href");
      expect(href).toContain("google.com/maps/dir");
    }
  });
});
