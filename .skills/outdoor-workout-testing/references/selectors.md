# Selector Guide for Outdoor Workout Spots

Guide to finding stable, maintainable selectors for Playwright tests.

## Selector Priority

Use selectors in this order of preference:

1. **data-testid attributes** (most stable)
2. **Role-based selectors** (accessible)
3. **Text content** (fragile for i18n)
4. **CSS classes** (fragile for styling changes)
5. **XPath** (last resort)

## Required data-testid Attributes

For the test suite to work properly, add these data-testid attributes to your components:

### Core Components

```tsx
// Spot card component
<div data-testid={`spot-card-${spot.id}`}>
  <h3 data-testid={`spot-title-${spot.id}`}>{spot.title}</h3>
  <p data-testid={`spot-distance-${spot.id}`}>{distance}</p>
</div>

// Search input
<input
  data-testid="search-input"
  type="text"
  placeholder="Search spots..."
/>

// Equipment filters
<button data-testid="filter-bars">Bars</button>
<button data-testid="filter-rings">Rings</button>
<button data-testid="filter-track">Track</button>

// Map container
<div data-testid="map-container">
  {/* MapLibre map */}
</div>

// Map markers (optional)
<Marker data-testid={`map-marker-${spot.id}`} />

// Loading indicator
<div data-testid="loading-indicator">Loading...</div>

// Load more button (if using button instead of auto-scroll)
<button data-testid="load-more">Load More</button>

// Location button
<button data-testid="location-button">Use My Location</button>

// Error message
<div data-testid="error-message">{error}</div>
```

### Spot Detail Page

```tsx
// Spot detail container
<div data-testid="spot-detail">
  <h1 data-testid="spot-detail-title">{spot.title}</h1>
  <address data-testid="spot-detail-address">{spot.address}</address>

  {/* Equipment list */}
  <ul data-testid="spot-equipment-list">
    {equipment.map((item) => (
      <li key={item} data-testid={`equipment-${item}`}>{item}</li>
    ))}
  </ul>

  {/* Images */}
  <div data-testid="spot-images">
    {images.map((img, i) => (
      <img
        key={i}
        data-testid={`spot-image-${i}`}
        src={img}
        alt={`${spot.title} - Image ${i + 1}`}
      />
    ))}
  </div>

  {/* Map on detail page */}
  <div data-testid="spot-detail-map">
    {/* MapLibre map */}
  </div>
</div>
```

## Alternative Selectors (if data-testid not available)

### Using Role Selectors

```typescript
// Search input
page.getByRole('searchbox');
page.getByRole('textbox', { name: /search/i });

// Buttons
page.getByRole('button', { name: /bars/i });
page.getByRole('button', { name: /load more/i });

// Headings
page.getByRole('heading', { name: /outdoor workout spot/i });

// Links
page.getByRole('link', { name: /view details/i });
```

### Using Text Selectors

```typescript
// By exact text
page.locator('text=Bars');

// By partial text
page.locator('text=/loading/i');

// Combining with element
page.locator('button:has-text("Load More")');
```

### Using CSS Selectors

```typescript
// By class (avoid if possible)
page.locator('.spot-card');
page.locator('.neon-border');

// By attribute
page.locator('[type="search"]');
page.locator('[aria-label="Search spots"]');

// Combining selectors
page.locator('.spot-card[data-spot-id="100"]');
```

## MapLibre Selectors

### Map Container

```typescript
// By class (MapLibre adds these)
page.locator('.maplibregl-map');

// Or use data-testid
page.locator('[data-testid="map-container"]');
```

### Map Markers

```typescript
// All markers
page.locator('.maplibregl-marker');

// User location marker (if custom class added)
page.locator('.maplibregl-marker.user-location');

// Specific marker (if data-testid added)
page.locator('[data-testid="map-marker-100"]');
```

### Map Controls

```typescript
// Zoom controls
page.locator('.maplibregl-ctrl-zoom-in');
page.locator('.maplibregl-ctrl-zoom-out');

// Navigation controls
page.locator('.maplibregl-ctrl-compass');
```

## Dynamic Content Selectors

### Handling Infinite Scroll

```typescript
// All loaded spot cards
page.locator('[data-testid^="spot-card-"]');

// Count loaded spots
await page.locator('[data-testid^="spot-card-"]').count();

// Nth spot card
page.locator('[data-testid^="spot-card-"]').nth(0); // First
page.locator('[data-testid^="spot-card-"]').nth(-1); // Last
```

### Handling Filtered Results

```typescript
// Wait for results to update after filter
await page.locator('[data-testid^="spot-card-"]').first().waitFor();

// Check if no results
await expect(page.locator('text=/no results/i')).toBeVisible();
```

## Best Practices

### DO

- **Use data-testid for dynamic content**:
  ```typescript
  // Good
  page.locator('[data-testid="spot-card-100"]');

  // Bad
  page.locator('.spot-card:nth-child(3)');
  ```

- **Use role selectors for static elements**:
  ```typescript
  // Good
  page.getByRole('button', { name: /search/i });

  // Less good
  page.locator('button.search-btn');
  ```

- **Combine selectors for specificity**:
  ```typescript
  // Good
  page.locator('[data-testid="spot-card-100"]').getByRole('heading');

  // Less specific
  page.getByRole('heading');
  ```

### DON'T

- **Avoid brittle CSS selectors**:
  ```typescript
  // Bad - breaks when styling changes
  page.locator('.bg-gray-900.border-neon-cyan.rounded-lg');

  // Good
  page.locator('[data-testid="spot-card-100"]');
  ```

- **Avoid XPath when possible**:
  ```typescript
  // Bad
  page.locator('//div[@class="spot-card"]//h3');

  // Good
  page.locator('[data-testid="spot-card-100"] h3');
  ```

- **Avoid position-based selectors**:
  ```typescript
  // Bad - order may change
  page.locator('.spot-card').nth(2);

  // Good - use stable identifier
  page.locator('[data-testid="spot-card-100"]');
  ```

## Debugging Selectors

### Check if selector matches elements

```typescript
// In test
const count = await page.locator('[data-testid^="spot-card-"]').count();
console.log(`Found ${count} spot cards`);

// Get all matching elements
const elements = await page.locator('[data-testid^="spot-card-"]').all();
console.log(`Found ${elements.length} elements`);
```

### Use Playwright Inspector

```bash
# Run test in debug mode
npx playwright test --debug

# Or use codegen to generate selectors
npx playwright codegen http://localhost:3000
```

### Print element details

```typescript
// Get element text
const text = await page.locator('[data-testid="spot-title-100"]').textContent();
console.log(`Title: ${text}`);

// Get element attributes
const classes = await page.locator('[data-testid="spot-card-100"]').getAttribute('class');
console.log(`Classes: ${classes}`);

// Check visibility
const isVisible = await page.locator('[data-testid="spot-card-100"]').isVisible();
console.log(`Visible: ${isVisible}`);
```

## Adding data-testid Attributes

### React Component Example

```tsx
// components/Spots/SpotCard.tsx
interface SpotCardProps {
  spot: CalisthenicsSpot;
  selected?: boolean;
  onClick?: () => void;
}

export function SpotCard({ spot, selected, onClick }: SpotCardProps) {
  return (
    <div
      data-testid={`spot-card-${spot.id}`}
      className={`spot-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <h3 data-testid={`spot-title-${spot.id}`}>
        {spot.title}
      </h3>

      {spot.distance && (
        <p data-testid={`spot-distance-${spot.id}`}>
          {spot.distance} km away
        </p>
      )}

      {spot.details?.equipment && (
        <ul data-testid={`spot-equipment-${spot.id}`}>
          {spot.details.equipment.map((item, i) => (
            <li key={i} data-testid={`equipment-${spot.id}-${i}`}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Search Component Example

```tsx
// components/Search/SearchBar.tsx
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      data-testid="search-input"
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search workout spots..."
      aria-label="Search spots"
    />
  );
}
```

### Filter Component Example

```tsx
// components/Search/QuickFilters.tsx
interface QuickFiltersProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

export function QuickFilters({ filters, onChange }: QuickFiltersProps) {
  return (
    <div className="filters">
      <button
        data-testid="filter-bars"
        className={filters.bars ? 'active' : ''}
        onClick={() => onChange({ ...filters, bars: !filters.bars })}
      >
        Bars
      </button>

      <button
        data-testid="filter-rings"
        className={filters.rings ? 'active' : ''}
        onClick={() => onChange({ ...filters, rings: !filters.rings })}
      >
        Rings
      </button>

      <button
        data-testid="filter-track"
        className={filters.track ? 'active' : ''}
        onClick={() => onChange({ ...filters, track: !filters.track })}
      >
        Track
      </button>
    </div>
  );
}
```

## Conditional Rendering

### Handle optional elements

```typescript
// Check if element exists before interacting
const locationButton = page.locator('[data-testid="location-button"]');
if (await locationButton.isVisible()) {
  await locationButton.click();
}

// Or use count
const imageCount = await page.locator('[data-testid^="spot-image-"]').count();
if (imageCount > 0) {
  // Images are present
}

// Or use waitFor with timeout
await page.locator('[data-testid="spot-images"]')
  .waitFor({ state: 'visible', timeout: 5000 })
  .catch(() => {
    // No images, that's OK
  });
```
