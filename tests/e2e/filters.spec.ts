import { test, expect } from "@playwright/test";

test.describe("Filters", () => {
  test("filter buttons are visible", async ({ page }) => {
    await page.goto("/");
    const filters = page.getByTestId("quick-filters");
    await expect(filters).toBeVisible();
  });

  test("can toggle filter on and off", async ({ page }) => {
    await page.goto("/");
    const barsFilter = page.getByTestId("filter-hasBars");
    await barsFilter.click();
    await expect(barsFilter).toHaveClass(/bg-accent/);

    await barsFilter.click();
    await expect(barsFilter).not.toHaveClass(/bg-accent/);
  });

  test("clear button resets all filters", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("filter-hasBars").click();
    await page.getByTestId("filter-hasRings").click();

    const clear = page.getByTestId("filter-clear");
    await expect(clear).toBeVisible();
    await clear.click();

    await expect(page.getByTestId("filter-hasBars")).not.toHaveClass(/bg-accent/);
    await expect(page.getByTestId("filter-hasRings")).not.toHaveClass(/bg-accent/);
  });

  test("filter updates URL", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("filter-hasBars").click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/bars=1/);
  });
});
