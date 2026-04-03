import { test, expect } from "@playwright/test";

test.describe("Filters", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("filter buttons are visible", async ({ page }) => {
    await page.goto("/");
    const filters = page.getByTestId("quick-filters").first();
    await expect(filters).toBeVisible();
  });

  test("can toggle filter on and off", async ({ page }) => {
    await page.goto("/");
    const barsFilter = page.getByTestId("filter-hasBars").first();
    await barsFilter.click();
    await expect(barsFilter).toHaveClass(/bg-accent/);

    await barsFilter.click();
    await expect(barsFilter).not.toHaveClass(/bg-accent/);
  });

  test("clear button resets all filters", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("filter-hasBars").first().click();
    await page.getByTestId("filter-hasRings").first().click();

    const clear = page.getByTestId("filter-clear").first();
    await expect(clear).toBeVisible();
    await clear.click();

    await expect(page.getByTestId("filter-hasBars").first()).not.toHaveClass(/bg-accent/);
    await expect(page.getByTestId("filter-hasRings").first()).not.toHaveClass(/bg-accent/);
  });

  test("filter updates URL", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("filter-hasBars").first().click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/bars=1/);
  });
});
