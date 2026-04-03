# Mobile Testing Guide

Patterns for testing Outdoor Workout Spots on mobile viewports and devices.

## Mobile Viewports

### Predefined Devices

Playwright includes device descriptors for common devices:

```typescript
import { test, devices } from '@playwright/test';

// iPhone 13 Pro
test.use(devices['iPhone 13 Pro']);

// Pixel 5
test.use(devices['Pixel 5']);

// iPad Pro
test.use(devices['iPad Pro']);
```

### Custom Viewport

```typescript
test.use({
  viewport: { width: 375, height: 667 }, // iPhone SE
  userAgent: 'Mozilla/5.0 ...',
  isMobile: true,
  hasTouch: true,
});
```

## Mobile-Specific Tests

### Pattern: Test Mobile Layout

```typescript
import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Layout', () => {
  test.use(devices['iPhone 13 Pro']);

  test('should display mobile-optimized layout', async ({ page }) => {
    await page.goto('/');

    // Check viewport height (using dvh)
    const height = await page.evaluate(() => window.innerHeight);
    expect(height).toBeGreaterThan(600);

    // Verify stacked layout (search → filters → map → list)
    const searchBox = page.locator('[data-testid="search-input"]');
    const mapContainer = page.locator('[data-testid="map-container"]');
    const spotList = page.locator('[data-testid="spot-list"]');

    const searchY = await searchBox.boundingBox().then(b => b?.y ?? 0);
    const mapY = await mapContainer.boundingBox().then(b => b?.y ?? 0);
    const listY = await spotList.boundingBox().then(b => b?.y ?? 0);

    // Elements should be stacked vertically
    expect(mapY).toBeGreaterThan(searchY);
    expect(listY).toBeGreaterThan(mapY);
  });
});
```

### Pattern: Test Touch Interactions

```typescript
test.describe('Touch Interactions', () => {
  test.use(devices['iPhone 13 Pro']);

  test('should handle touch on map markers', async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);

    // Tap a marker
    const marker = page.locator('.maplibregl-marker').first();
    await marker.tap();

    // Spot should be selected
    await page.waitForTimeout(300);
    const selectedCard = page.locator('[data-testid^="spot-card-"].selected');
    await expect(selectedCard).toBeVisible();
  });

  test('should handle swipe gestures', async ({ page }) => {
    await page.goto('/');
    await waitForSpots(page, 100);

    // Swipe up to scroll
    await page.touchscreen.tap(200, 400);
    await page.touchscreen.tap(200, 100); // Swipe up

    // Should trigger infinite scroll
    await page.waitForTimeout(1000);
    const spotCount = await getSpotCount(page);
    expect(spotCount).toBeGreaterThan(100);
  });
});
```

### Pattern: Test Safe Area Insets

```typescript
test.describe('PWA Safe Areas', () => {
  test.use(devices['iPhone 13 Pro']);

  test('should respect safe area insets', async ({ page }) => {
    await page.goto('/');

    // Check CSS variables are set
    const safeAreaTop = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--sat');
    });

    // Should have safe area top set (for notch)
    expect(safeAreaTop).toBeTruthy();

    // Header should account for safe area
    const header = page.locator('header');
    const headerPadding = await header.evaluate(el =>
      getComputedStyle(el).paddingTop
    );

    // Should include safe area padding
    expect(headerPadding).not.toBe('0px');
  });
});
```

## Touch Gestures

### Tap

```typescript
// Single tap
await page.locator('[data-testid="filter-bars"]').tap();

// Double tap (zoom)
await page.locator('[data-testid="map-container"]').dblclick();
```

### Swipe

```typescript
// Swipe up (scroll down)
const element = page.locator('[data-testid="spot-list"]');
const box = await element.boundingBox();
if (box) {
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width / 2, box.y + 50);
}

// Swipe down (scroll up)
await page.touchscreen.tap(200, 100);
await page.mouse.move(200, 400);
```

### Pinch to Zoom (on map)

```typescript
test('should zoom map with pinch gesture', async ({ page }) => {
  await page.goto('/');
  await waitForMap(page);

  // Get initial zoom level
  const initialZoom = await page.evaluate(() => {
    return window.map.getZoom();
  });

  // Simulate pinch out (zoom in)
  // Note: MapLibre may not fully support touch simulation
  // Test this manually or with a real device
  await page.evaluate(() => {
    window.map.zoomIn();
  });

  await page.waitForTimeout(500);

  const newZoom = await page.evaluate(() => {
    return window.map.getZoom();
  });

  expect(newZoom).toBeGreaterThan(initialZoom);
});
```

## Orientation Testing

### Portrait

```typescript
test('should work in portrait mode', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); // Portrait
  await page.goto('/');

  // Verify layout
  await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
  await expect(page.locator('[data-testid="spot-list"]')).toBeVisible();
});
```

### Landscape

```typescript
test('should adapt to landscape mode', async ({ page }) => {
  await page.setViewportSize({ width: 812, height: 375 }); // Landscape
  await page.goto('/');

  // Layout may change (side-by-side)
  await expect(page.locator('[data-testid="map-container"]')).toBeVisible();

  // Map might take more screen space in landscape
  const mapBox = await page.locator('[data-testid="map-container"]').boundingBox();
  expect(mapBox?.width).toBeGreaterThan(400);
});
```

### Rotate Device

```typescript
test('should handle orientation change', async ({ page }) => {
  // Start in portrait
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await waitForMap(page);

  // Rotate to landscape
  await page.setViewportSize({ width: 812, height: 375 });
  await page.waitForTimeout(500);

  // Map should still work
  await expect(page.locator('[data-testid="map-container"]')).toBeVisible();

  // Markers should still be visible
  await expect(page.locator('.maplibregl-marker').first()).toBeVisible();
});
```

## Virtual Keyboard

### Pattern: Test Keyboard Appearance

```typescript
test('should handle virtual keyboard', async ({ page, context }) => {
  test.use(devices['iPhone 13 Pro']);

  await page.goto('/');

  // Focus on search input
  const searchInput = page.locator('[data-testid="search-input"]');
  await searchInput.tap();

  // Keyboard should appear (viewport shrinks)
  // Note: Hard to test programmatically, consider visual testing

  // Type on virtual keyboard
  await searchInput.fill('park');

  // Verify input received text
  await expect(searchInput).toHaveValue('park');

  // Dismiss keyboard
  await page.keyboard.press('Enter');
});
```

## Network Conditions

### Pattern: Test on Slow Network

```typescript
test('should work on 3G network', async ({ page, context }) => {
  // Simulate slow 3G
  await page.route('**/*', async route => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Add latency
    return route.continue();
  });

  await page.goto('/');

  // Should still load, just slower
  await waitForSpots(page, 100, 15000); // Longer timeout

  // Loading indicators should be visible longer
  await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
});
```

### Pattern: Test Offline

```typescript
test('should handle offline mode', async ({ page, context }) => {
  await page.goto('/');
  await waitForSpots(page, 100);

  // Go offline
  await context.setOffline(true);

  // Try to load more
  await scrollToBottom(page);

  // Should show offline message
  await expect(page.locator('text=/offline|no connection/i')).toBeVisible();

  // Go back online
  await context.setOffline(false);

  // Should recover
  await page.waitForTimeout(2000);
  await scrollToBottom(page);
  const spotCount = await getSpotCount(page);
  expect(spotCount).toBeGreaterThan(100);
});
```

## Geolocation

### Pattern: Test Location Permission

```typescript
test('should request location permission on mobile', async ({ page, context }) => {
  test.use(devices['iPhone 13 Pro']);

  // Grant location permission
  await context.grantPermissions(['geolocation']);

  // Set location (San Francisco)
  await context.setGeolocation({
    latitude: 37.7749,
    longitude: -122.4194
  });

  await page.goto('/');

  // Tap location button
  const locationButton = page.locator('[data-testid="location-button"]');
  await locationButton.tap();

  // User location marker should appear
  await page.waitForTimeout(1000);
  await expect(page.locator('.user-location-marker')).toBeVisible();
});
```

## Mobile-Specific Performance

### Pattern: Test Render Performance

```typescript
test('should render smoothly on mobile', async ({ page }) => {
  test.use(devices['iPhone 13 Pro']);

  await page.goto('/');

  // Measure time to interactive
  const tti = await page.evaluate(() => {
    return performance.timing.domInteractive - performance.timing.navigationStart;
  });

  // Should be interactive within 3 seconds
  expect(tti).toBeLessThan(3000);
});
```

### Pattern: Test Scroll Performance

```typescript
test('should scroll smoothly on mobile', async ({ page }) => {
  test.use(devices['iPhone 13 Pro']);

  await page.goto('/');
  await waitForSpots(page, 100);

  // Enable performance metrics
  await page.evaluate(() => {
    (window as any).scrollStartTime = Date.now();
  });

  // Scroll
  await scrollToBottom(page);

  const scrollTime = await page.evaluate(() => {
    const start = (window as any).scrollStartTime;
    return Date.now() - start;
  });

  // Scroll should complete quickly
  expect(scrollTime).toBeLessThan(1000);
});
```

## PWA Features

### Pattern: Test Add to Home Screen

```typescript
test('should show PWA install prompt', async ({ page, context }) => {
  test.use(devices['iPhone 13 Pro']);

  await page.goto('/');

  // Check manifest is loaded
  const manifestLink = page.locator('link[rel="manifest"]');
  await expect(manifestLink).toHaveAttribute('href', '/manifest.json');

  // Fetch manifest
  const manifestResponse = await page.goto('/manifest.json');
  const manifest = await manifestResponse?.json();

  // Verify PWA manifest
  expect(manifest.name).toBe('Outdoor Workout Spots');
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons).toBeDefined();
});
```

### Pattern: Test Standalone Mode

```typescript
test('should work in standalone PWA mode', async ({ page }) => {
  // Simulate standalone mode
  await page.addInitScript(() => {
    Object.defineProperty(window.navigator, 'standalone', {
      value: true,
      writable: false
    });
  });

  await page.goto('/');

  // Should detect PWA mode
  const isPWA = await page.evaluate(() => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone;
  });

  expect(isPWA).toBe(true);
});
```

## Debugging Mobile Tests

### Take Screenshots

```typescript
test('mobile screenshot', async ({ page }) => {
  test.use(devices['iPhone 13 Pro']);

  await page.goto('/');
  await waitForMap(page);

  // Take screenshot
  await page.screenshot({ path: 'screenshots/mobile-home.png' });
});
```

### Use Headed Mode

```bash
# Watch tests run on emulated mobile device
npx playwright test --headed --project=mobile
```

### Use Playwright Inspector

```bash
# Debug mobile tests
npx playwright test --debug --project=mobile
```

## Cross-Device Testing

### Test Matrix

```typescript
const mobileDevices = [
  'iPhone 13 Pro',
  'iPhone SE',
  'Pixel 5',
  'Galaxy S9+',
  'iPad Pro',
];

mobileDevices.forEach(deviceName => {
  test.describe(`${deviceName} Tests`, () => {
    test.use(devices[deviceName]);

    test('should load on device', async ({ page }) => {
      await page.goto('/');
      await waitForSpots(page, 100);
      await waitForMap(page);

      // Basic smoke test
      await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
    });
  });
});
```

## Best Practices

### DO

- Test on both iOS and Android viewports
- Test touch interactions, not just clicks
- Test both portrait and landscape orientations
- Test with slow network conditions
- Test offline functionality
- Verify safe area insets for notched devices
- Test geolocation features

### DON'T

- Don't assume mouse-only interactions
- Don't ignore keyboard appearance/dismissal
- Don't forget about orientation changes
- Don't neglect PWA-specific features
- Don't test only on desktop-sized viewports
