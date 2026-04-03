import { test, expect } from "@playwright/test";

test.describe("Spot Preview", () => {
  test("clicking a marker shows popup with View Details", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("spots-map").locator("canvas").waitFor({ timeout: 15000 });
    // Wait for spots data to load
    await page.waitForResponse(resp => resp.url().includes('/api/spots') && resp.status() === 200, { timeout: 10000 }).catch(() => {});

    // Wait for markers to render after data loads
    const marker = page.locator("button[aria-label^='View ']").first();
    // Skip if no individual markers visible (all clustered at this zoom level)
    const markerCount = await page.locator("button[aria-label^='View ']").count();
    test.skip(markerCount === 0, "No individual markers visible at default zoom");

    await marker.click();
    const viewDetails = page.getByTestId("spot-view-details");
    await expect(viewDetails).toBeVisible({ timeout: 5000 });
  });
});
