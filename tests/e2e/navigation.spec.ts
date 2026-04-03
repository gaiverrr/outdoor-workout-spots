import { test, expect } from "@playwright/test";

test.describe("Navigation — Back Button State Preservation", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("navigating back from spot detail restores search query", async ({ page }) => {
    // Set search, wait for URL sync
    await page.goto("/");
    const input = page.getByTestId("search-input").first();
    await input.fill("Berlin");
    await expect(page).toHaveURL(/q=Berlin/, { timeout: 5000 });

    // Navigate to spot detail
    await page.goto("/spots/83");
    await page.getByTestId("spot-title").waitFor({ timeout: 15000 });

    // Go back and verify search restored
    await page.goBack();
    const restoredInput = page.getByTestId("search-input").first();
    await expect(restoredInput).toHaveValue("Berlin", { timeout: 10000 });
  });

  test("URL params are preserved across navigation", async ({ page }) => {
    await page.goto("/?q=Berlin");
    const input = page.getByTestId("search-input").first();
    await expect(input).toHaveValue("Berlin");

    await page.goto("/spots/83");
    await page.goBack();
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/q=Berlin/, { timeout: 5000 });
  });
});
