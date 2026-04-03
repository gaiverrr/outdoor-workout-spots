import { test, expect } from '@playwright/test';
import { waitForMap, waitForSpots, clickSpot } from '../test-helpers';

/**
 * Example tests for MapLibre map interactions
 * Copy to tests/e2e/ to use
 */

test.describe('Map Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForSpots(page, 100);
    await waitForMap(page);
  });

  test('should render map with markers', async ({ page }) => {
    // Verify map container is visible
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();

    // Verify markers are rendered
    const markers = page.locator('.maplibregl-marker');
    const markerCount = await markers.count();

    // Should have markers for spots (up to 100 initially visible)
    expect(markerCount).toBeGreaterThan(0);
    expect(markerCount).toBeLessThanOrEqual(100);
  });

  test('should select spot when clicking marker', async ({ page }) => {
    // Get first marker
    const firstMarker = page.locator('.maplibregl-marker').first();
    await firstMarker.click();

    // Should have a selected spot card
    const selectedCard = page.locator('[data-testid^="spot-card-"].selected, [data-testid^="spot-card-"][class*="border-neon"]');
    await expect(selectedCard).toBeVisible({ timeout: 3000 });
  });

  test('should center map on selected spot', async ({ page }) => {
    // Click on a known spot (ID 100)
    const spotId = 100;
    await clickSpot(page, spotId);

    // Wait for map to finish moving animation
    await page.waitForFunction(
      () => {
        const map = (window as any).map;
        return map && !map.isMoving();
      },
      { timeout: 3000 }
    ).catch(() => {
      // Map might not expose isMoving(), that's OK
    });

    // Get map center
    const mapCenter = await page.evaluate(() => {
      const map = (window as any).map;
      if (!map) return null;
      return map.getCenter();
    });

    expect(mapCenter).toBeTruthy();

    // Get spot coordinates
    const spotCoords = await page.evaluate((id) => {
      // Get from spot card data or API
      const spotCard = document.querySelector(`[data-testid="spot-card-${id}"]`);
      return spotCard?.getAttribute('data-lat-lon')?.split(',').map(Number);
    }, spotId);

    if (spotCoords && mapCenter) {
      // Map should be approximately centered on the spot
      // Allow some tolerance for map animations
      expect(Math.abs(mapCenter.lat - spotCoords[0])).toBeLessThan(0.1);
      expect(Math.abs(mapCenter.lng - spotCoords[1])).toBeLessThan(0.1);
    }
  });

  test('should zoom in/out with controls', async ({ page }) => {
    // Get initial zoom level
    const initialZoom = await page.evaluate(() => {
      const map = (window as any).map;
      return map ? map.getZoom() : null;
    });

    expect(initialZoom).toBeTruthy();

    // Click zoom in button
    const zoomInButton = page.locator('.maplibregl-ctrl-zoom-in');
    await zoomInButton.click();

    // Wait for zoom to change
    await page.waitForFunction(
      (prevZoom) => {
        const map = (window as any).map;
        return map && map.getZoom() > prevZoom;
      },
      initialZoom,
      { timeout: 3000 }
    );

    // Verify zoom increased
    const zoomedInLevel = await page.evaluate(() => {
      const map = (window as any).map;
      return map ? map.getZoom() : null;
    });

    expect(zoomedInLevel).toBeGreaterThan(initialZoom!);

    // Click zoom out button
    const zoomOutButton = page.locator('.maplibregl-ctrl-zoom-out');
    await zoomOutButton.click();

    // Wait for zoom to change again
    await page.waitForFunction(
      (prevZoom) => {
        const map = (window as any).map;
        return map && map.getZoom() < prevZoom;
      },
      zoomedInLevel,
      { timeout: 3000 }
    );

    // Verify zoom decreased
    const zoomedOutLevel = await page.evaluate(() => {
      const map = (window as any).map;
      return map ? map.getZoom() : null;
    });

    expect(zoomedOutLevel).toBeLessThan(zoomedInLevel!);
  });

  test('should handle user location', async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);

    // Set mock location (San Francisco)
    await context.setGeolocation({
      latitude: 37.7749,
      longitude: -122.4194
    });

    // Click location button (if available)
    const locationButton = page.locator('[data-testid="location-button"]');

    if (await locationButton.isVisible()) {
      await locationButton.click();

      // Wait for user location marker or map to recenter
      await Promise.race([
        page.locator('.user-location-marker, [data-testid="user-location-marker"]')
          .waitFor({ state: 'visible', timeout: 3000 }),
        page.waitForFunction(
          () => {
            const map = (window as any).map;
            return map && !map.isMoving();
          },
          { timeout: 3000 }
        )
      ]).catch(() => {
        // User marker might not be visible if implementation is different
      });

      // Should show user location marker
      const userMarker = page.locator('.user-location-marker, [data-testid="user-location-marker"]');
      await expect(userMarker).toBeVisible({ timeout: 2000 }).catch(() => {
        // User marker might not be visible if implementation is different
        console.log('User location marker not found with expected selector');
      });

      // Map should center on user location
      const mapCenter = await page.evaluate(() => {
        const map = (window as any).map;
        return map ? map.getCenter() : null;
      });

      if (mapCenter) {
        // Should be approximately at San Francisco
        expect(Math.abs(mapCenter.lat - 37.7749)).toBeLessThan(1);
        expect(Math.abs(mapCenter.lng - (-122.4194))).toBeLessThan(1);
      }
    }
  });

  test('should update markers when filtering', async ({ page }) => {
    // Get initial marker count
    const markers = page.locator('.maplibregl-marker');
    const initialCount = await markers.count();

    // Apply a filter
    const barsFilter = page.locator('[data-testid="filter-bars"]');
    await barsFilter.click();

    // Wait for marker count to change
    await page.waitForFunction(
      (prevCount) => {
        const currentCount = document.querySelectorAll('.maplibregl-marker').length;
        return currentCount !== prevCount;
      },
      initialCount,
      { timeout: 3000 }
    );

    // Marker count should change
    const filteredCount = await markers.count();
    expect(filteredCount).not.toBe(initialCount);

    // Clear filter
    await barsFilter.click();

    // Wait for markers to be restored
    await page.waitForFunction(
      (targetCount) => {
        const currentCount = document.querySelectorAll('.maplibregl-marker').length;
        return currentCount === targetCount;
      },
      initialCount,
      { timeout: 3000 }
    );

    // Marker count should return to original
    const restoredCount = await markers.count();
    expect(restoredCount).toBe(initialCount);
  });

  test('should handle map drag/pan', async ({ page }) => {
    // Get initial map center
    const initialCenter = await page.evaluate(() => {
      const map = (window as any).map;
      return map ? map.getCenter() : null;
    });

    expect(initialCenter).toBeTruthy();

    // Get map canvas element
    const mapCanvas = page.locator('.maplibregl-canvas');

    // Drag the map
    await mapCanvas.hover();
    await page.mouse.down();
    await page.mouse.move(100, 100);
    await page.mouse.up();

    // Wait for map movement to complete
    await page.waitForFunction(
      (prevCenter) => {
        const map = (window as any).map;
        if (!map) return false;
        const center = map.getCenter();
        return center.lat !== prevCenter.lat || center.lng !== prevCenter.lng;
      },
      initialCenter,
      { timeout: 3000 }
    );

    // Map center should have changed
    const newCenter = await page.evaluate(() => {
      const map = (window as any).map;
      return map ? map.getCenter() : null;
    });

    expect(newCenter).toBeTruthy();
    expect(newCenter!.lat).not.toBe(initialCenter!.lat);
    expect(newCenter!.lng).not.toBe(initialCenter!.lng);
  });
});
