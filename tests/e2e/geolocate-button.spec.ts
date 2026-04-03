import { test, expect } from "@playwright/test";

test.describe("GeolocateControl visibility", () => {
  test("visible on desktop (not covered by anything)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.getByTestId("spots-map").locator("canvas").waitFor({ timeout: 15000 });

    const btn = page.locator(".maplibregl-ctrl-geolocate");
    await expect(btn).toBeVisible();

    // Check it's not covered — button should be clickable (not behind bottom sheet)
    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    // Button should be within visible map area, not below the fold
    expect(box!.y + box!.height).toBeLessThan(800);
  });

  test("visible on mobile above bottom sheet", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto("/");
    await page.getByTestId("spots-map").locator("canvas").waitFor({ timeout: 15000 });
    await page.waitForTimeout(1000);

    const btn = page.locator(".maplibregl-ctrl-geolocate");
    await expect(btn).toBeVisible();

    // Bottom sheet peek is ~72px from bottom. Button must be above it.
    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    // Button bottom edge should be above the bottom sheet (viewport height - peek height ~72px)
    expect(box!.y + box!.height).toBeLessThan(851 - 72);
  });

  test("visible in half-screen mode (small viewport)", async ({ page }) => {
    // Simulates Telegram Mini App half-screen: map in ~400px tall viewport
    await page.setViewportSize({ width: 393, height: 430 });
    await page.goto("/");
    await page.getByTestId("spots-map").locator("canvas").waitFor({ timeout: 15000 });
    await page.waitForTimeout(1000);

    const btn = page.locator(".maplibregl-ctrl-geolocate");
    await expect(btn).toBeVisible();

    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThan(430 - 72);
  });
});
