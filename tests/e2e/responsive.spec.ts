import { test, expect } from "@playwright/test";

test.describe("Responsive Layout", () => {
  test("desktop shows sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
  });

  test("mobile hides sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto("/");
    const sidebar = page.locator("aside");
    await expect(sidebar).not.toBeVisible();
  });

  test("mobile shows bottom sheet", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto("/");
    const sheet = page.getByTestId("bottom-sheet");
    await expect(sheet).toBeVisible();
  });

  test("desktop hides bottom sheet", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const sheet = page.getByTestId("bottom-sheet");
    await expect(sheet).not.toBeVisible();
  });
});
