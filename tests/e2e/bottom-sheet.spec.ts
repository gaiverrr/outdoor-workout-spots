import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["Pixel 5"] });

test.describe("Bottom Sheet (Mobile)", () => {
  test("bottom sheet is visible in peek state", async ({ page }) => {
    await page.goto("/");
    const sheet = page.getByTestId("bottom-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveAttribute("data-state", "peek");
  });

  test("shows spot count", async ({ page }) => {
    await page.goto("/");
    const handle = page.getByTestId("bottom-sheet-handle");
    await expect(handle).toContainText(/\d+ spots nearby/);
  });

  test("content area is scrollable", async ({ page }) => {
    await page.goto("/");
    // Wait for spots to load
    await page.waitForTimeout(3000);

    const content = page.getByTestId("bottom-sheet-content");
    // Verify the content div has overflow-y auto and min-h-0 (scrollable setup)
    await expect(content).toHaveCSS("overflow-y", "auto");
    await expect(content).toHaveCSS("min-height", "0px");
  });
});
