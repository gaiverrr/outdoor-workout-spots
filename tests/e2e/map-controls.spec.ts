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

  test("GeolocateControl button is visible on map", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("spots-map").locator("canvas").waitFor({ timeout: 15000 });

    const geolocateBtn = page.locator(".maplibregl-ctrl-geolocate");
    await expect(geolocateBtn).toBeVisible();
  });
});
