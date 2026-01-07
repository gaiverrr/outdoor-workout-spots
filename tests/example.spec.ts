import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');

  // Expect the page title to contain "Outdoor Workout Spots"
  await expect(page).toHaveTitle(/Outdoor Workout Spots/);
});

test('search functionality is present', async ({ page }) => {
  await page.goto('/');

  // Check if search input exists
  const searchInput = page.getByPlaceholder(/search/i);
  await expect(searchInput).toBeVisible();
});

test('map is displayed', async ({ page }) => {
  await page.goto('/');

  // Wait for map container to be visible
  const mapContainer = page.locator('.maplibregl-canvas');
  await expect(mapContainer).toBeVisible({ timeout: 10000 });
});
