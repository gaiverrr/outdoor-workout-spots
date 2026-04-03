import { test, expect } from "@playwright/test";

test.describe("Search", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("search input is visible", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("search-input").first();
    await expect(input).toBeVisible();
  });

  test("can type search query", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("search-input").first();
    await input.fill("Berlin");
    await expect(input).toHaveValue("Berlin");
  });

  test("clear button appears and works", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("search-input").first();
    await input.fill("test");

    const clear = page.getByTestId("search-clear").first();
    await expect(clear).toBeVisible();
    await clear.click();
    await expect(input).toHaveValue("");
  });

  test("search updates URL", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("search-input").first();
    await input.fill("Berlin");
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/q=Berlin/);
  });
});
