import { test, expect } from "@playwright/test";

test.describe("Navigation — Back Button State Preservation", () => {
  test("navigating back from spot detail restores search query", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("search-input");
    await input.fill("Berlin");
    await page.waitForTimeout(500);

    await page.goto("/spots/1");
    await page.getByTestId("spot-title").waitFor({ timeout: 10000 });

    await page.goBack();
    await page.waitForTimeout(500);

    await expect(input).toHaveValue("Berlin");
  });

  test("URL params are preserved across navigation", async ({ page }) => {
    await page.goto("/?q=Berlin&bars=1");
    const input = page.getByTestId("search-input");
    await expect(input).toHaveValue("Berlin");

    await page.goto("/spots/1");
    await page.goBack();
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/q=Berlin/);
    await expect(page).toHaveURL(/bars=1/);
  });
});
