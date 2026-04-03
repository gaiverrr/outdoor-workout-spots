import { test, expect } from "@playwright/test";

test.describe("Map Controls", () => {
  test("desktop shows navigation controls", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.getByTestId("spots-map").locator("canvas").waitFor({ timeout: 15000 });
    const nav = page.locator(".maplibregl-ctrl-zoom-in");
    await expect(nav).toBeVisible();
  });

  test("mobile hides navigation controls", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto("/");
    await page.getByTestId("spots-map").locator("canvas").waitFor({ timeout: 15000 });
    const nav = page.locator(".maplibregl-ctrl-zoom-in");
    await expect(nav).not.toBeVisible();
  });

  test("locate-me button visible when geolocation granted", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 52.52, longitude: 13.405 });

    await page.goto("/");
    await page.getByTestId("spots-map").locator("canvas").waitFor({ timeout: 15000 });

    const locateBtn = page.getByTestId("locate-me-map");
    await expect(locateBtn).toBeVisible({ timeout: 10000 });
  });

  test("locate-me button not visible without geolocation", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("spots-map").locator("canvas").waitFor({ timeout: 15000 });
    await page.waitForTimeout(2000);

    const locateBtn = page.getByTestId("locate-me-map");
    await expect(locateBtn).not.toBeVisible();
  });
});
