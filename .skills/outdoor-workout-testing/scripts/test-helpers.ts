import { Page, expect } from '@playwright/test';

/**
 * Test helper utilities for Outdoor Workout Spots E2E tests
 */

/**
 * Wait for the MapLibre map to fully load
 * @param page - Playwright page object
 * @param timeout - Maximum wait time in ms (default: 10000)
 */
export async function waitForMap(page: Page, timeout = 10000): Promise<void> {
  // Wait for map container to be visible
  const mapContainer = page.locator('[data-testid="map-container"]');
  await expect(mapContainer).toBeVisible({ timeout });

  // Wait for at least one marker to appear (indicates map has loaded data)
  const markers = page.locator('.maplibregl-marker, [data-testid^="map-marker-"]');
  await expect(markers.first()).toBeVisible({ timeout });

  // Wait for map to finish loading/rendering
  await page.waitForFunction(
    () => {
      const map = (window as any).map;
      return map && map.loaded();
    },
    { timeout }
  ).catch(() => {
    // Map might not expose loaded() method, that's OK if markers are visible
  });
}

/**
 * Wait for spots to load via TanStack Query
 * @param page - Playwright page object
 * @param minCount - Minimum number of spots expected (default: 1)
 * @param timeout - Maximum wait time in ms (default: 10000)
 */
export async function waitForSpots(
  page: Page,
  minCount = 1,
  timeout = 10000
): Promise<void> {
  const spotCards = page.locator('[data-testid^="spot-card-"]');

  // Wait for at least minCount spot cards to appear
  // Playwright will automatically retry until condition is met
  await expect(spotCards).toHaveCount(minCount, { timeout });

  // Optionally verify loading indicator is gone (if it was shown)
  const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
  if (await loadingIndicator.isVisible().catch(() => false)) {
    await expect(loadingIndicator).toBeHidden({ timeout: 5000 });
  }
}

/**
 * Check that API response has correct structure
 * @param page - Playwright page object
 * @param endpoint - API endpoint to check (e.g., '/api/spots')
 * @returns Response JSON data
 */
export async function checkApiResponse(
  page: Page,
  endpoint: string
): Promise<any> {
  const response = await page.waitForResponse(
    (resp) => resp.url().includes(endpoint) && resp.status() === 200
  );

  const data = await response.json();

  // Verify structure
  expect(data).toHaveProperty('spots');
  expect(data).toHaveProperty('pagination');
  expect(Array.isArray(data.spots)).toBe(true);
  expect(data.pagination).toHaveProperty('limit');
  expect(data.pagination).toHaveProperty('offset');
  expect(data.pagination).toHaveProperty('total');
  expect(data.pagination).toHaveProperty('hasMore');

  return data;
}

/**
 * Scroll to bottom of page to trigger infinite scroll
 * @param page - Playwright page object
 */
export async function scrollToBottom(page: Page): Promise<void> {
  const initialHeight = await page.evaluate(() => document.body.scrollHeight);

  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  // Wait for either new content to render or network to idle
  await Promise.race([
    page.waitForFunction(
      (prevHeight) => document.body.scrollHeight > prevHeight,
      initialHeight,
      { timeout: 5000 }
    ).catch(() => {}), // Might be at end of list
    page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
  ]);
}

/**
 * Scroll until a specific number of spots are loaded
 * @param page - Playwright page object
 * @param targetCount - Target number of spots
 * @param maxScrolls - Maximum scroll attempts (default: 10)
 */
export async function scrollUntilSpotCount(
  page: Page,
  targetCount: number,
  maxScrolls = 10
): Promise<void> {
  const spotCards = page.locator('[data-testid^="spot-card-"]');

  for (let scrollCount = 0; scrollCount < maxScrolls; scrollCount++) {
    const currentCount = await spotCards.count();

    if (currentCount >= targetCount) {
      break;
    }

    // Get count before scroll
    const countBefore = currentCount;
    await scrollToBottom(page);

    // Wait for new items to appear or timeout
    await page.waitForFunction(
      ([prevCount, target]) => {
        const currentCount = document.querySelectorAll('[data-testid^="spot-card-"]').length;
        return currentCount > prevCount || currentCount >= target;
      },
      [countBefore, targetCount],
      { timeout: 5000 }
    ).catch(() => {
      // Might have reached end of list
    });
  }

  // Verify we reached at least the target count
  const finalCount = await spotCards.count();
  if (finalCount < targetCount) {
    throw new Error(`Only loaded ${finalCount} spots, expected ${targetCount}`);
  }
}

/**
 * Search for spots using the search input
 * @param page - Playwright page object
 * @param query - Search query string
 */
export async function searchSpots(page: Page, query: string): Promise<void> {
  const searchInput = page.locator('[data-testid="search-input"]');
  const spotCards = page.locator('[data-testid^="spot-card-"]');

  // Get initial count to detect when results change
  const initialCount = await spotCards.count().catch(() => 0);

  await searchInput.fill(query);

  // Wait for search to trigger and results to update
  await Promise.race([
    // Wait for API response with search query
    page.waitForResponse(
      resp => resp.url().includes('/api/spots') && resp.url().includes('search='),
      { timeout: 3000 }
    ),
    // Or wait for spot count to change
    page.waitForFunction(
      (prevCount) => {
        const currentCount = document.querySelectorAll('[data-testid^="spot-card-"]').length;
        return currentCount !== prevCount;
      },
      initialCount,
      { timeout: 3000 }
    )
  ]).catch(() => {
    // Results might be cached or no change needed
  });
}

/**
 * Clear search input
 * @param page - Playwright page object
 */
export async function clearSearch(page: Page): Promise<void> {
  const searchInput = page.locator('[data-testid="search-input"]');
  const spotCards = page.locator('[data-testid^="spot-card-"]');

  // Get count before clearing
  const countBefore = await spotCards.count().catch(() => 0);

  await searchInput.clear();

  // Wait for results to update
  await page.waitForFunction(
    (prevCount) => {
      const currentCount = document.querySelectorAll('[data-testid^="spot-card-"]').length;
      return currentCount !== prevCount;
    },
    countBefore,
    { timeout: 3000 }
  ).catch(() => {
    // Count might not change if search was already empty
  });
}

/**
 * Toggle an equipment filter
 * @param page - Playwright page object
 * @param filterType - Filter type ('bars', 'rings', 'track')
 */
export async function toggleFilter(
  page: Page,
  filterType: 'bars' | 'rings' | 'track'
): Promise<void> {
  const filter = page.locator(`[data-testid="filter-${filterType}"]`);
  const spotCards = page.locator('[data-testid^="spot-card-"]');

  // Get state before toggle
  const countBefore = await spotCards.count().catch(() => 0);
  const classesBefore = await filter.getAttribute('class') || '';

  await filter.click();

  // Wait for filter state to change (visual feedback)
  await expect(filter).not.toHaveClass(classesBefore, { timeout: 2000 });

  // Wait for results to update
  await page.waitForFunction(
    (prevCount) => {
      const currentCount = document.querySelectorAll('[data-testid^="spot-card-"]').length;
      return currentCount !== prevCount;
    },
    countBefore,
    { timeout: 3000 }
  ).catch(() => {
    // Count might not change if no spots match/unmatch filter
  });
}

/**
 * Click on a spot card by ID
 * @param page - Playwright page object
 * @param spotId - Spot ID to click
 */
export async function clickSpot(page: Page, spotId: number): Promise<void> {
  const spotCard = page.locator(`[data-testid="spot-card-${spotId}"]`);

  // Click and wait for selection state to change
  await spotCard.click();

  // Wait for the card to be marked as selected (visual feedback)
  await expect(spotCard).toHaveClass(/selected|border-neon/, { timeout: 2000 }).catch(() => {
    // Selection might be indicated differently in implementation
  });
}

/**
 * Navigate to a spot detail page
 * @param page - Playwright page object
 * @param spotId - Spot ID to navigate to
 */
export async function navigateToSpotDetail(
  page: Page,
  spotId: number
): Promise<void> {
  await page.goto(`/spots/${spotId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Request user location (clicks location button)
 * @param page - Playwright page object
 */
export async function requestLocation(page: Page): Promise<void> {
  const locationButton = page.locator('[data-testid="location-button"]');

  // Grant geolocation permission in the context
  await page.context().grantPermissions(['geolocation']);

  // Set mock location (San Francisco)
  await page.context().setGeolocation({
    latitude: 37.7749,
    longitude: -122.4194
  });

  await locationButton.click();

  // Wait for user location marker to appear or distance to be calculated
  await Promise.race([
    page.locator('.user-location-marker, [data-testid="user-location-marker"]')
      .waitFor({ state: 'visible', timeout: 3000 })
      .catch(() => {}),
    page.locator('[data-testid^="spot-distance-"]')
      .first()
      .waitFor({ state: 'visible', timeout: 3000 })
      .catch(() => {})
  ]);
}

/**
 * Get the count of visible spot cards
 * @param page - Playwright page object
 * @returns Number of visible spot cards
 */
export async function getSpotCount(page: Page): Promise<number> {
  const spotCards = page.locator('[data-testid^="spot-card-"]');
  return await spotCards.count();
}

/**
 * Check if a spot card is selected
 * @param page - Playwright page object
 * @param spotId - Spot ID to check
 * @returns True if selected
 */
export async function isSpotSelected(
  page: Page,
  spotId: number
): Promise<boolean> {
  const spotCard = page.locator(`[data-testid="spot-card-${spotId}"]`);
  const classes = await spotCard.getAttribute('class') || '';

  // Check for selected class (adjust based on actual implementation)
  return classes.includes('selected') || classes.includes('border-neon');
}

/**
 * Wait for images to load in a spot card or detail page
 * @param page - Playwright page object
 * @param timeout - Maximum wait time in ms (default: 10000)
 */
export async function waitForImages(
  page: Page,
  timeout = 10000
): Promise<void> {
  // Wait for at least one image to be visible
  const images = page.locator('img[src*="r2.dev"]');
  await expect(images.first()).toBeVisible({ timeout }).catch(() => {
    // Some spots don't have images, that's OK
  });

  // Wait for all images to finish loading
  await page.waitForFunction(
    () => {
      const images = Array.from(document.images);
      return images.every(img => img.complete);
    },
    { timeout }
  ).catch(() => {
    // Some images might fail to load, that's OK
  });
}
