import { test, expect } from "@playwright/test";

test.describe("Map", () => {
  test("renders map canvas", async ({ page }) => {
    await page.goto("/");
    const map = page.getByTestId("spots-map");
    await expect(map).toBeVisible();
    const canvas = map.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 15000 });
  });

  test("shows navigation controls", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("spots-map").locator("canvas").waitFor({ timeout: 15000 });
    const nav = page.locator(".maplibregl-ctrl-zoom-in");
    await expect(nav).toBeVisible();
  });

  test("displays spot markers after loading", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("spots-map").locator("canvas").waitFor({ timeout: 15000 });
    // Wait for spots API response instead of arbitrary timeout
    await page.waitForResponse(resp => resp.url().includes('/api/spots') && resp.status() === 200, { timeout: 10000 }).catch(() => {});
    const markers = page.locator("[aria-label*='spot'], [aria-label*='Cluster'], [aria-label^='View ']");
    await expect(markers.first()).toBeVisible({ timeout: 10000 });
  });
});
