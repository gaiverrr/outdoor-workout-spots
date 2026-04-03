---
name: outdoor-workout-testing
description: Comprehensive Playwright E2E testing for the Outdoor Workout Spots PWA. Use when creating, updating, or running tests for the Next.js app with MapLibre maps, infinite scroll, search/filters, TanStack Query, and mobile viewport testing. Covers critical user journeys including map interactions, spot search, pagination, and detail pages.
---

# Outdoor Workout Testing

Playwright E2E testing skill for the Outdoor Workout Spots PWA application.

## Quick Start

1. **Install Playwright** (if not already installed):
   ```bash
   npm install -D @playwright/test @playwright/browser-chromium
   npx playwright install chromium
   ```

2. **Copy Playwright config**:
   ```bash
   cp .skills/outdoor-workout-testing/assets/playwright.config.ts .
   ```

3. **Run tests**:
   ```bash
   npm run dev  # Start dev server in one terminal
   npx playwright test  # Run tests in another terminal
   ```

## Test Structure

Tests should be organized by user flow:

```
tests/e2e/
├── map-interactions.spec.ts      # Map markers, zoom, pan
├── search-filter.spec.ts         # Search bar and equipment filters
├── infinite-scroll.spec.ts       # Pagination and loading
├── spot-details.spec.ts          # Individual spot pages
└── mobile.spec.ts                # Mobile viewport tests
```

## Testing Patterns

### Test Against Real API

Tests run against the actual Turso database and API endpoints. Ensure dev server is running on `http://localhost:3000`.

### Key Selectors

Use stable data attributes for selectors (see [references/selectors.md](references/selectors.md)):
- `data-testid="spot-card-{id}"` - Spot cards
- `data-testid="search-input"` - Search bar
- `data-testid="filter-{type}"` - Equipment filters
- `data-testid="map-container"` - Map component

### Wait Strategies

Use appropriate waits for dynamic content:
- **TanStack Query loading**: Wait for `data-testid="loading-indicator"` to disappear
- **Map initialization**: Wait for MapLibre `load` event or visible markers
- **Infinite scroll**: Wait for new items to appear after scrolling
- **API responses**: Use `page.waitForResponse()` for specific endpoints

See [references/test-patterns.md](references/test-patterns.md) for detailed examples.

## Critical User Flows

### 1. Map Interactions

Test MapLibre map functionality:
- Map renders with initial markers
- Clicking a marker selects the spot
- Map centers on selected spot
- User location marker appears when location is enabled

### 2. Search and Filtering

Test search and filter functionality:
- Search input filters spots by title/address
- Equipment filters (bars, rings, track) work correctly
- Multiple filters can be combined
- Search clears properly
- Results update in real-time

### 3. Infinite Scroll

Test pagination with TanStack Query:
- Initial 100 spots load
- Scrolling triggers loading more spots
- Loading indicator appears during fetch
- Cached data displays instantly
- "No more results" message when all spots loaded

### 4. Spot Details

Test individual spot pages:
- Navigate to `/spots/[id]`
- Spot data displays correctly
- Images load from Cloudflare R2
- Map shows single spot marker
- Back navigation works

### 5. Mobile Viewport

Test mobile-specific functionality:
- Responsive layout adapts correctly
- Touch interactions work on map
- Safe area insets respected
- Filters toggle properly

## Helper Utilities

Use the test helpers from `scripts/test-helpers.ts`:

```typescript
import { waitForMap, waitForSpots, checkApiResponse } from '../scripts/test-helpers';

// Wait for map to load
await waitForMap(page);

// Wait for spots to load via TanStack Query
await waitForSpots(page);

// Verify API response structure
await checkApiResponse(page, '/api/spots');
```

## Running Tests

**All tests:**
```bash
npx playwright test
```

**Specific test file:**
```bash
npx playwright test tests/e2e/map-interactions.spec.ts
```

**Debug mode:**
```bash
npx playwright test --debug
```

**Mobile viewport:**
```bash
npx playwright test --project=mobile
```

**Headed mode (watch tests run):**
```bash
npx playwright test --headed
```

## Test Data Considerations

- Tests use real data from Turso database (26,977 spots)
- First spot ID: 100 (use for consistent testing)
- Some spots may not have images (67% have images)
- 98.5% of spots have GPS coordinates
- Search for common terms like "park" or "gym" for reliable results

## Mobile Testing

See [references/mobile-testing.md](references/mobile-testing.md) for mobile-specific patterns:
- Test on multiple viewports (iPhone, Android)
- Verify touch interactions
- Check safe area insets for PWA
- Test landscape orientation

## Continuous Integration

Add to your CI pipeline:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npx playwright test
```

## When to Update Tests

Update tests when:
- Adding new features
- Changing UI components
- Modifying API endpoints
- Updating data structure
- Changing routing
