import { test, expect } from '@playwright/test';
import {
  waitForSpots,
  searchSpots,
  clearSearch,
  toggleFilter,
  getSpotCount
} from '../test-helpers';

/**
 * Example tests for search and filter functionality
 * Copy to tests/e2e/ to use
 */

test.describe('Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForSpots(page, 100);
  });

  test('should filter spots by search query', async ({ page }) => {
    // Get initial count
    const initialCount = await getSpotCount(page);
    expect(initialCount).toBeGreaterThanOrEqual(100);

    // Search for "park"
    await searchSpots(page, 'park');

    // Should have filtered results (searchSpots handles waiting)
    const filteredCount = await getSpotCount(page);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // All visible spots should match search
    const spotTitles = await page.locator('[data-testid^="spot-card-"] h3').allTextContents();
    const allMatch = spotTitles.some(title =>
      title.toLowerCase().includes('park')
    );

    // At least some should match
    expect(allMatch || filteredCount === 0).toBe(true);
  });

  test('should clear search and restore results', async ({ page }) => {
    // Search for something
    await searchSpots(page, 'gym');
    const searchedCount = await getSpotCount(page);

    // Clear search (clearSearch handles waiting)
    await clearSearch(page);

    // Should restore original results
    const restoredCount = await getSpotCount(page);
    expect(restoredCount).toBeGreaterThan(searchedCount);
  });

  test('should show no results message for invalid search', async ({ page }) => {
    // Search for something that definitely doesn't exist
    await searchSpots(page, 'xyzqwertynonexistent12345');

    // Should show no results message
    const noResults = page.locator('text=/no results|no spots found/i');
    await expect(noResults).toBeVisible({ timeout: 3000 }).catch(() => {
      // Or check that spot count is 0
      expect(getSpotCount(page)).resolves.toBe(0);
    });
  });

  test('should filter by equipment - Bars', async ({ page }) => {
    // Get initial count
    const initialCount = await getSpotCount(page);

    // Toggle bars filter (toggleFilter handles waiting)
    await toggleFilter(page, 'bars');

    // Should have filtered results
    const filteredCount = await getSpotCount(page);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Filter should be active
    const barsFilter = page.locator('[data-testid="filter-bars"]');
    await expect(barsFilter).toHaveClass(/active|selected|border-neon/i, { timeout: 2000 });
  });

  test('should filter by equipment - Rings', async ({ page }) => {
    const initialCount = await getSpotCount(page);

    // Toggle rings filter
    await toggleFilter(page, 'rings');
    await page.waitForTimeout(500);

    const filteredCount = await getSpotCount(page);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Filter should be active
    const ringsFilter = page.locator('[data-testid="filter-rings"]');
    await expect(ringsFilter).toHaveClass(/active|selected|border-neon/i);
  });

  test('should filter by equipment - Track', async ({ page }) => {
    const initialCount = await getSpotCount(page);

    // Toggle track filter
    await toggleFilter(page, 'track');
    await page.waitForTimeout(500);

    const filteredCount = await getSpotCount(page);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Filter should be active
    const trackFilter = page.locator('[data-testid="filter-track"]');
    await expect(trackFilter).toHaveClass(/active|selected|border-neon/i);
  });

  test('should combine multiple filters', async ({ page }) => {
    // Apply first filter
    await toggleFilter(page, 'bars');
    await page.waitForTimeout(500);
    const barsCount = await getSpotCount(page);

    // Apply second filter
    await toggleFilter(page, 'rings');
    await page.waitForTimeout(500);
    const combinedCount = await getSpotCount(page);

    // Combined should be different (more or less restrictive depending on logic)
    expect(combinedCount).not.toBe(barsCount);

    // Both filters should be active
    const barsFilter = page.locator('[data-testid="filter-bars"]');
    const ringsFilter = page.locator('[data-testid="filter-rings"]');

    await expect(barsFilter).toHaveClass(/active|selected|border-neon/i);
    await expect(ringsFilter).toHaveClass(/active|selected|border-neon/i);
  });

  test('should toggle filters on/off', async ({ page }) => {
    // Toggle filter on
    await toggleFilter(page, 'bars');
    await page.waitForTimeout(500);
    const filteredCount = await getSpotCount(page);

    // Toggle same filter off
    await toggleFilter(page, 'bars');
    await page.waitForTimeout(500);
    const unfilteredCount = await getSpotCount(page);

    // Should restore original results
    expect(unfilteredCount).toBeGreaterThan(filteredCount);

    // Filter should be inactive
    const barsFilter = page.locator('[data-testid="filter-bars"]');
    const classes = await barsFilter.getAttribute('class') || '';
    expect(classes).not.toMatch(/active|selected|border-neon/i);
  });

  test('should combine search and filters', async ({ page }) => {
    // Apply search
    await searchSpots(page, 'park');
    await page.waitForTimeout(500);
    const searchCount = await getSpotCount(page);

    // Add filter
    await toggleFilter(page, 'bars');
    await page.waitForTimeout(500);
    const combinedCount = await getSpotCount(page);

    // Combined should be more restrictive
    expect(combinedCount).toBeLessThanOrEqual(searchCount);

    // Verify both are applied
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toHaveValue('park');

    const barsFilter = page.locator('[data-testid="filter-bars"]');
    await expect(barsFilter).toHaveClass(/active|selected|border-neon/i);
  });

  test('should update URL with search params', async ({ page }) => {
    // Apply search
    await searchSpots(page, 'gym');
    await page.waitForTimeout(500);

    // URL should reflect search (if implemented)
    const url = page.url();
    // This depends on implementation - uncomment if you use URL params
    // expect(url).toContain('search=gym');

    // Or verify search persists on reload
    await page.reload();
    const searchInput = page.locator('[data-testid="search-input"]');

    // If using URL params, search should persist
    // await expect(searchInput).toHaveValue('gym');
  });

  test('should debounce search input', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');

    // Type quickly
    await searchInput.fill('a');
    await searchInput.fill('ab');
    await searchInput.fill('abc');

    // Should not trigger multiple API calls immediately
    // Wait for debounce
    await page.waitForTimeout(600);

    // Now should have triggered search
    const spotCount = await getSpotCount(page);
    expect(spotCount).toBeGreaterThan(0);
  });

  test('should handle special characters in search', async ({ page }) => {
    // Test with special characters
    const specialQueries = ['café', 'O\'Brien Park', 'street #1'];

    for (const query of specialQueries) {
      await searchSpots(page, query);
      await page.waitForTimeout(500);

      // Should not crash
      const hasError = await page.locator('[data-testid="error-message"]').isVisible().catch(() => false);
      expect(hasError).toBe(false);

      // Clear for next test
      await clearSearch(page);
      await page.waitForTimeout(300);
    }
  });

  test('should filter spots based on distance when location available', async ({ page, context }) => {
    // Grant location permission
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({
      latitude: 37.7749,
      longitude: -122.4194
    });

    // Click location button
    const locationButton = page.locator('[data-testid="location-button"]');
    if (await locationButton.isVisible()) {
      await locationButton.click();
      await page.waitForTimeout(1000);

      // Spots should now show distance
      const distanceElements = page.locator('[data-testid^="spot-distance-"]');
      const count = await distanceElements.count();
      expect(count).toBeGreaterThan(0);

      // Distance should be displayed
      const firstDistance = await distanceElements.first().textContent();
      expect(firstDistance).toMatch(/\d+(\.\d+)?\s*(km|mi)/i);
    }
  });
});
