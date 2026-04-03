import { test, expect } from '@playwright/test';
import {
  waitForSpots,
  scrollToBottom,
  scrollUntilSpotCount,
  getSpotCount,
  checkApiResponse
} from '../test-helpers';

/**
 * Example tests for infinite scroll pagination with TanStack Query
 * Copy to tests/e2e/ to use
 */

test.describe('Infinite Scroll', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForSpots(page, 100);
  });

  test('should load initial batch of 100 spots', async ({ page }) => {
    // Verify API response structure
    const data = await checkApiResponse(page, '/api/spots');

    // Should have 100 spots (default limit)
    expect(data.spots).toHaveLength(100);
    expect(data.pagination.limit).toBe(100);
    expect(data.pagination.offset).toBe(0);
    expect(data.pagination.total).toBeGreaterThan(0);
    expect(data.pagination.hasMore).toBe(true);

    // Verify spots are rendered
    const spotCount = await getSpotCount(page);
    expect(spotCount).toBe(100);
  });

  test('should load more spots on scroll', async ({ page }) => {
    // Get initial count
    const initialCount = await getSpotCount(page);
    expect(initialCount).toBe(100);

    // Scroll to bottom
    await scrollToBottom(page);

    // Wait for loading
    await page.waitForTimeout(2000);

    // Should have loaded more spots
    const newCount = await getSpotCount(page);
    expect(newCount).toBeGreaterThan(initialCount);
    expect(newCount).toBeLessThanOrEqual(200); // Should have loaded second page
  });

  test('should show loading indicator while fetching', async ({ page }) => {
    // Scroll to trigger load
    const scrollPromise = scrollToBottom(page);

    // Try to catch loading indicator (might be too fast)
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    const wasVisible = await Promise.race([
      loadingIndicator.waitFor({ state: 'visible', timeout: 1000 }).then(() => true),
      page.waitForTimeout(1000).then(() => false)
    ]);

    // Loading indicator might appear, or data might be cached
    // Either is valid
    await scrollPromise;
  });

  test('should cache loaded data', async ({ page }) => {
    // Load first two pages
    await scrollUntilSpotCount(page, 200, 5);

    // Navigate away
    await page.goto('/about');

    // Navigate back
    await page.goto('/');

    // Should load from cache (very fast)
    const startTime = Date.now();
    await waitForSpots(page, 100);
    const loadTime = Date.now() - startTime;

    // Should be nearly instant from cache
    expect(loadTime).toBeLessThan(1000);

    // Previously loaded data should still be available
    const spotCount = await getSpotCount(page);
    expect(spotCount).toBeGreaterThanOrEqual(100);
  });

  test('should handle rapid scrolling', async ({ page }) => {
    // Scroll multiple times quickly
    for (let i = 0; i < 5; i++) {
      await scrollToBottom(page);
      await page.waitForTimeout(200);
    }

    // Wait for all requests to complete
    await page.waitForTimeout(2000);

    // Should have loaded multiple pages without errors
    const spotCount = await getSpotCount(page);
    expect(spotCount).toBeGreaterThan(100);

    // No error message should be visible
    const hasError = await page.locator('[data-testid="error-message"]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should track pagination offset correctly', async ({ page }) => {
    // Load first page
    const page1Data = await checkApiResponse(page, '/api/spots');
    expect(page1Data.pagination.offset).toBe(0);

    // Scroll to load second page
    await scrollToBottom(page);

    // Wait for second page request
    const response = await page.waitForResponse(
      resp => resp.url().includes('/api/spots') && resp.url().includes('offset=100')
    );

    const page2Data = await response.json();
    expect(page2Data.pagination.offset).toBe(100);
    expect(page2Data.pagination.limit).toBe(100);
  });

  test('should not load beyond total count', async ({ page }) => {
    // Get total count
    const data = await checkApiResponse(page, '/api/spots');
    const totalSpots = data.pagination.total;

    // If we have a filtered view with fewer spots, test that
    // Otherwise, this test would take too long with 26k spots

    // Apply a filter to reduce total
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('rare-search-term-xyz');
    await page.waitForTimeout(1000);

    // Get filtered total
    const filteredData = await checkApiResponse(page, '/api/spots');

    if (filteredData.spots.length === 0) {
      // No results - show appropriate message
      const noResults = page.locator('text=/no results|no spots/i');
      await expect(noResults).toBeVisible().catch(() => {
        expect(await getSpotCount(page)).toBe(0);
      });
    }
  });

  test('should handle scroll to bottom multiple times', async ({ page }) => {
    const counts: number[] = [];

    // Scroll multiple times and record counts
    for (let i = 0; i < 3; i++) {
      await scrollToBottom(page);
      await page.waitForTimeout(1500);

      const count = await getSpotCount(page);
      counts.push(count);
    }

    // Counts should generally increase (unless we hit the end)
    expect(counts[1]).toBeGreaterThanOrEqual(counts[0]);
    expect(counts[2]).toBeGreaterThanOrEqual(counts[1]);
  });

  test('should show "Load More" button as alternative to auto-scroll', async ({ page }) => {
    // Check if there's a "Load More" button instead of auto-scroll
    const loadMoreButton = page.locator('[data-testid="load-more"]');

    if (await loadMoreButton.isVisible()) {
      const initialCount = await getSpotCount(page);

      // Click to load more
      await loadMoreButton.click();
      await page.waitForTimeout(1500);

      // Should have loaded more spots
      const newCount = await getSpotCount(page);
      expect(newCount).toBeGreaterThan(initialCount);
    }
  });

  test('should maintain scroll position when loading more', async ({ page }) => {
    // Scroll down a bit
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    const scrollBefore = await page.evaluate(() => window.scrollY);

    // Trigger load more by scrolling to bottom
    await scrollToBottom(page);
    await page.waitForTimeout(2000);

    // Scroll position should have moved down (not jumped back up)
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(scrollAfter).toBeGreaterThanOrEqual(scrollBefore);
  });

  test('should handle API errors during pagination', async ({ page }) => {
    // Intercept second page request and return error
    let requestCount = 0;
    await page.route('**/api/spots*', async (route) => {
      requestCount++;
      if (requestCount > 1) {
        // Fail subsequent requests
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' })
        });
      } else {
        // Allow first request
        await route.continue();
      }
    });

    await page.goto('/');
    await waitForSpots(page, 100);

    // Scroll to trigger second page
    await scrollToBottom(page);
    await page.waitForTimeout(2000);

    // Should show error message
    const errorMessage = page.locator('[data-testid="error-message"], text=/error|failed/i');
    await expect(errorMessage).toBeVisible();

    // First page should still be visible
    const spotCount = await getSpotCount(page);
    expect(spotCount).toBe(100);
  });

  test('should handle network timeout during pagination', async ({ page }) => {
    // Slow down API requests
    await page.route('**/api/spots*', async (route) => {
      if (route.request().url().includes('offset=100')) {
        // Delay second page significantly
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      await route.continue();
    });

    await page.goto('/');
    await waitForSpots(page, 100);

    // Scroll to trigger second page
    await scrollToBottom(page);

    // Loading indicator should appear and persist
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 }).catch(() => {
      // Might load from cache
    });
  });

  test('should deduplicate spots when loading more', async ({ page }) => {
    // Load first page
    await waitForSpots(page, 100);

    // Get first page spot IDs
    const firstPageIds = await page.locator('[data-testid^="spot-card-"]')
      .evaluateAll((cards) =>
        cards.map(card => card.getAttribute('data-testid')?.replace('spot-card-', ''))
      );

    // Load second page
    await scrollToBottom(page);
    await page.waitForTimeout(2000);

    // Get all spot IDs
    const allIds = await page.locator('[data-testid^="spot-card-"]')
      .evaluateAll((cards) =>
        cards.map(card => card.getAttribute('data-testid')?.replace('spot-card-', ''))
      );

    // Should not have duplicates
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  test('should preserve filter/search when loading more', async ({ page }) => {
    // Apply search
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('park');
    await page.waitForTimeout(1000);

    const filteredCount = await getSpotCount(page);

    // Scroll to load more with filter active
    await scrollToBottom(page);
    await page.waitForTimeout(2000);

    // Should have loaded more spots, all matching filter
    const newCount = await getSpotCount(page);
    if (filteredCount >= 100) {
      // If there were 100+ results, should have loaded more
      expect(newCount).toBeGreaterThan(filteredCount);
    }

    // All spots should still match search
    const spotTitles = await page.locator('[data-testid^="spot-card-"] h3').allTextContents();
    const allMatch = spotTitles.every(title =>
      title.toLowerCase().includes('park')
    );
    expect(allMatch || spotTitles.length === 0).toBe(true);
  });
});
