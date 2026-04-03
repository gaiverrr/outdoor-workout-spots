# Test Patterns for Outdoor Workout Spots

Best practices for testing Next.js app with MapLibre, TanStack Query, and infinite scroll.

## Auto-Waiting Best Practices

Playwright has built-in auto-waiting features. **Always prefer these over `waitForTimeout()`**:

### ✅ DO: Use Auto-Waiting

```typescript
// Use expect with timeout
await expect(page.locator('[data-testid="spot-card-100"]')).toBeVisible({ timeout: 5000 });

// Wait for specific condition
await page.waitForFunction(() => {
  return document.querySelectorAll('[data-testid^="spot-card-"]').length >= 100;
});

// Wait for network response
await page.waitForResponse(resp => resp.url().includes('/api/spots'));

// Wait for element state change
await expect(filter).toHaveClass(/active/, { timeout: 3000 });
```

### ❌ DON'T: Use Arbitrary Timeouts

```typescript
// Bad - race conditions and flaky tests
await page.click('[data-testid="filter-bars"]');
await page.waitForTimeout(500); // ❌ Arbitrary wait

// Good - wait for actual condition
await page.click('[data-testid="filter-bars"]');
await expect(page.locator('[data-testid="filter-bars"]')).toHaveClass(/active/);
```

### Helper Functions Handle Waiting

The test helpers already implement auto-waiting:
- `waitForMap()` - Waits for map to load using `waitForFunction()`
- `waitForSpots()` - Waits for spot count using `expect().toHaveCount()`
- `searchSpots()` - Waits for API response or DOM updates
- `toggleFilter()` - Waits for filter state and results change
- `scrollToBottom()` - Waits for new content using `waitForFunction()`

## TanStack Query Testing

### Pattern: Wait for Query to Resolve

```typescript
import { test, expect } from '@playwright/test';
import { waitForSpots, checkApiResponse } from '../scripts/test-helpers';

test('should load spots via TanStack Query', async ({ page }) => {
  await page.goto('/');

  // Wait for API request to complete
  const data = await checkApiResponse(page, '/api/spots');

  // Wait for spots to render
  await waitForSpots(page, 100);

  // Verify data
  expect(data.spots).toHaveLength(100);
  expect(data.pagination.hasMore).toBe(true);
});
```

### Pattern: Test Cached Data

```typescript
test('should use cached data on navigation', async ({ page }) => {
  await page.goto('/');
  await waitForSpots(page, 100);

  // Navigate away
  await page.goto('/about');

  // Navigate back - should load instantly from cache
  const startTime = Date.now();
  await page.goto('/');

  // Spots should appear immediately (< 100ms)
  await waitForSpots(page, 100);
  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(500); // Generous threshold for cached data
});
```

### Pattern: Test Background Refetch

```typescript
test('should refetch in background after stale time', async ({ page }) => {
  await page.goto('/');
  await waitForSpots(page, 100);

  // Advance time by 61 seconds (past staleTime)
  await page.waitForFunction(() => {
    // Trigger time advance if using fake timers
    return Date.now();
  });

  // Focus window to trigger refetch
  await page.evaluate(() => window.focus());

  // Wait for background refetch
  await page.waitForResponse(
    resp => resp.url().includes('/api/spots'),
    { timeout: 5000 }
  );
});
```

## MapLibre Testing

### Pattern: Wait for Map Load

```typescript
import { waitForMap } from '../scripts/test-helpers';

test('should render map with markers', async ({ page }) => {
  await page.goto('/');

  // Wait for map to fully load
  await waitForMap(page);

  // Verify markers are visible
  const markers = page.locator('.maplibregl-marker');
  await expect(markers).toHaveCount(await page.locator('[data-testid^="spot-card-"]').count());
});
```

### Pattern: Test Map Interactions

```typescript
test('should center map on marker click', async ({ page }) => {
  await page.goto('/');
  await waitForMap(page);

  // Get initial map center
  const initialCenter = await page.evaluate(() => {
    const map = window.map; // Assuming map is exposed globally
    return map.getCenter();
  });

  // Click a marker
  const marker = page.locator('.maplibregl-marker').first();
  await marker.click();

  // Wait for map to move
  await page.waitForTimeout(500);

  // Verify map center changed
  const newCenter = await page.evaluate(() => {
    const map = window.map;
    return map.getCenter();
  });

  expect(newCenter.lat).not.toBe(initialCenter.lat);
  expect(newCenter.lng).not.toBe(initialCenter.lng);
});
```

### Pattern: Test Map Bounds

```typescript
test('should filter spots by map bounds', async ({ page }) => {
  await page.goto('/');
  await waitForMap(page);

  // Zoom in to a specific area
  await page.evaluate(() => {
    const map = window.map;
    map.flyTo({ center: [2.3522, 48.8566], zoom: 12 }); // Paris
  });

  // Wait for map to finish moving
  await page.waitForTimeout(2000);

  // Should trigger API call with bounds
  await page.waitForResponse(
    resp => resp.url().includes('/api/spots') && resp.url().includes('minLat')
  );
});
```

## Infinite Scroll Testing

### Pattern: Test Initial Load

```typescript
import { waitForSpots } from '../scripts/test-helpers';

test('should load initial batch of spots', async ({ page }) => {
  await page.goto('/');

  // Wait for first page (100 spots)
  await waitForSpots(page, 100);

  // Verify pagination state
  const hasMoreButton = page.locator('[data-testid="load-more"]');
  await expect(hasMoreButton).toBeVisible();
});
```

### Pattern: Test Scroll Trigger

```typescript
import { scrollToBottom, getSpotCount } from '../scripts/test-helpers';

test('should load more spots on scroll', async ({ page }) => {
  await page.goto('/');
  await waitForSpots(page, 100);

  // Get initial count
  const initialCount = await getSpotCount(page);

  // Scroll to bottom
  await scrollToBottom(page);

  // Wait for new spots to load
  await page.waitForTimeout(2000);

  // Verify more spots loaded
  const newCount = await getSpotCount(page);
  expect(newCount).toBeGreaterThan(initialCount);
});
```

### Pattern: Test Loading State

```typescript
test('should show loading indicator while fetching', async ({ page }) => {
  await page.goto('/');
  await waitForSpots(page, 100);

  // Trigger scroll
  await scrollToBottom(page);

  // Loading indicator should appear briefly
  const loadingIndicator = page.locator('[data-testid="loading-indicator"]');

  // Note: This might be too fast to catch, so check for either:
  // 1. Loading indicator appeared
  // 2. New items loaded (cache hit)
  const loadingAppeared = await loadingIndicator.isVisible().catch(() => false);
  const moreItemsLoaded = await page.locator('[data-testid^="spot-card-"]')
    .count()
    .then(count => count > 100);

  expect(loadingAppeared || moreItemsLoaded).toBe(true);
});
```

### Pattern: Test End of List

```typescript
import { scrollUntilSpotCount } from '../scripts/test-helpers';

test('should show end message when all spots loaded', async ({ page }) => {
  await page.goto('/');

  // This would take too long with real data, so test with filtered results
  await page.locator('[data-testid="search-input"]').fill('very-rare-term');
  await page.waitForTimeout(500);

  // Scroll until no more results
  let previousCount = 0;
  let currentCount = await getSpotCount(page);

  while (currentCount > previousCount && currentCount < 1000) {
    previousCount = currentCount;
    await scrollToBottom(page);
    await page.waitForTimeout(1000);
    currentCount = await getSpotCount(page);
  }

  // Should show "no more results" message
  const endMessage = page.locator('text=/no more|end of list/i');
  await expect(endMessage).toBeVisible();
});
```

## Search and Filter Testing

### Pattern: Test Search Input

```typescript
import { searchSpots, getSpotCount } from '../scripts/test-helpers';

test('should filter spots by search query', async ({ page }) => {
  await page.goto('/');
  await waitForSpots(page, 100);

  const initialCount = await getSpotCount(page);

  // Search for "Paris"
  await searchSpots(page, 'Paris');

  // Wait for filtered results
  await page.waitForTimeout(1000);
  const filteredCount = await getSpotCount(page);

  // Should have fewer results
  expect(filteredCount).toBeLessThan(initialCount);

  // All visible spots should contain "Paris"
  const spotTitles = await page.locator('[data-testid^="spot-card-"] h3').allTextContents();
  const allMatch = spotTitles.every(title =>
    title.toLowerCase().includes('paris')
  );

  expect(allMatch).toBe(true);
});
```

### Pattern: Test Filter Toggle

```typescript
import { toggleFilter, getSpotCount } from '../scripts/test-helpers';

test('should filter spots by equipment', async ({ page }) => {
  await page.goto('/');
  await waitForSpots(page, 100);

  const initialCount = await getSpotCount(page);

  // Toggle "bars" filter
  await toggleFilter(page, 'bars');

  // Wait for filter to apply
  await page.waitForTimeout(500);
  const filteredCount = await getSpotCount(page);

  // Should have fewer results
  expect(filteredCount).toBeLessThanOrEqual(initialCount);

  // Filter should be active
  const barsFilter = page.locator('[data-testid="filter-bars"]');
  await expect(barsFilter).toHaveClass(/active|selected/);
});
```

### Pattern: Test Combined Filters

```typescript
test('should combine search and equipment filters', async ({ page }) => {
  await page.goto('/');
  await waitForSpots(page, 100);

  // Apply search
  await searchSpots(page, 'park');
  await page.waitForTimeout(500);
  const searchCount = await getSpotCount(page);

  // Add equipment filter
  await toggleFilter(page, 'rings');
  await page.waitForTimeout(500);
  const combinedCount = await getSpotCount(page);

  // Combined should be more restrictive
  expect(combinedCount).toBeLessThanOrEqual(searchCount);
});
```

## Spot Details Testing

### Pattern: Test Navigation

```typescript
import { navigateToSpotDetail } from '../scripts/test-helpers';

test('should navigate to spot detail page', async ({ page }) => {
  await page.goto('/');
  await waitForSpots(page, 100);

  // Get first spot ID
  const firstSpotId = await page.locator('[data-testid^="spot-card-"]')
    .first()
    .getAttribute('data-testid')
    .then(id => id?.replace('spot-card-', ''));

  // Click spot card
  await page.locator(`[data-testid="spot-card-${firstSpotId}"]`).click();

  // Wait for navigation
  await page.waitForURL(`/spots/${firstSpotId}`);

  // Verify spot details loaded
  await expect(page.locator('h1')).toBeVisible();
});
```

### Pattern: Test Images Load

```typescript
import { waitForImages } from '../scripts/test-helpers';

test('should load spot images from R2', async ({ page }) => {
  // Use spot ID known to have images (e.g., 100)
  await navigateToSpotDetail(page, 100);

  // Wait for images to load
  await waitForImages(page);

  // Verify R2 URLs
  const images = page.locator('img[src*="r2.dev"]');
  await expect(images.first()).toBeVisible();

  // Check image loaded successfully
  const naturalWidth = await images.first().evaluate(
    (img: HTMLImageElement) => img.naturalWidth
  );
  expect(naturalWidth).toBeGreaterThan(0);
});
```

## Error Handling

### Pattern: Test API Error

```typescript
test('should handle API errors gracefully', async ({ page }) => {
  // Intercept API and return error
  await page.route('**/api/spots*', route =>
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    })
  );

  await page.goto('/');

  // Should show error message
  const errorMessage = page.locator('text=/error|failed/i');
  await expect(errorMessage).toBeVisible();
});
```

### Pattern: Test Missing Data

```typescript
test('should handle spots without coordinates', async ({ page }) => {
  await page.goto('/');
  await waitForSpots(page, 100);

  // Count total spots vs. map markers
  const spotCount = await getSpotCount(page);
  const markerCount = await page.locator('.maplibregl-marker').count();

  // Some spots might not have coordinates
  expect(markerCount).toBeLessThanOrEqual(spotCount);
});
```

## Performance Testing

### Pattern: Test Initial Load Time

```typescript
test('should load page in reasonable time', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/');
  await waitForSpots(page, 100);
  await waitForMap(page);

  const loadTime = Date.now() - startTime;

  // Should load within 5 seconds
  expect(loadTime).toBeLessThan(5000);
});
```

### Pattern: Test Image Loading Performance

```typescript
test('should lazy load images', async ({ page }) => {
  await page.goto('/');
  await waitForSpots(page, 100);

  // Get images in viewport vs. total images
  const totalImages = await page.locator('img').count();
  const loadedImages = await page.locator('img').evaluateAll(
    (imgs: HTMLImageElement[]) => imgs.filter(img => img.complete).length
  );

  // Not all images should load immediately (lazy loading)
  expect(loadedImages).toBeLessThan(totalImages);
});
```
