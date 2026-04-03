import { test, expect } from "@playwright/test";

test.describe("Spot Preview", () => {
  test("clicking a marker shows popup with View Details", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("spots-map").locator("canvas").waitFor({ timeout: 15000 });
    await page.waitForTimeout(3000);

    const marker = page.locator("button[aria-label^='View ']").first();
    if (await marker.isVisible()) {
      await marker.click();
      const viewDetails = page.getByTestId("spot-view-details");
      await expect(viewDetails).toBeVisible({ timeout: 5000 });
    }
  });
});
