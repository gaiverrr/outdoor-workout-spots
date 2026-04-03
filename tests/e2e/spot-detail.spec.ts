import { test, expect } from "@playwright/test";

// Use a known spot ID from the database (ID 1 doesn't exist, first spot is 83)
const SPOT_ID = 83;

test.describe("Spot Detail", () => {
  test("detail page renders spot title", async ({ page }) => {
    await page.goto(`/spots/${SPOT_ID}`);
    const title = page.getByTestId("spot-title");
    await expect(title).toBeVisible({ timeout: 15000 });
    await expect(title).not.toBeEmpty();
  });

  test("back button is present", async ({ page }) => {
    await page.goto(`/spots/${SPOT_ID}`);
    await page.getByTestId("spot-title").waitFor({ timeout: 15000 });
    const back = page.getByTestId("back-button");
    await expect(back).toBeVisible();
  });

  test("share button is present", async ({ page }) => {
    await page.goto(`/spots/${SPOT_ID}`);
    await page.getByTestId("spot-title").waitFor({ timeout: 15000 });
    const share = page.getByTestId("share-button");
    await expect(share).toBeVisible();
  });

  test("Google Maps link has correct URL", async ({ page }) => {
    await page.goto(`/spots/${SPOT_ID}`);
    await page.getByTestId("spot-title").waitFor({ timeout: 15000 });
    const link = page.getByTestId("open-google-maps");
    if (await link.isVisible()) {
      const href = await link.getAttribute("href");
      expect(href).toContain("google.com/maps/dir");
    }
  });
});
