# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Outdoor Workout Spots is a Progressive Web App (PWA) for discovering outdoor workout locations, calisthenics parks, and street workout spots worldwide. Built with Next.js 16, React 19, and MapLibre GL for interactive mapping.

**Dataset:** 26,977 real workout spots with 35,795+ images hosted on Cloudflare R2 CDN.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### Data Flow

The app follows a client-side data flow pattern:

1. **Data Source**: Static JSON dataset (`data/spots.json`) with metadata wrapper containing 26,977 workout spots
2. **API Layer**: Next.js API route (`app/api/spots/route.ts`) extracts spots array, cleans/normalizes data with caching
3. **Custom Hooks**: React hooks fetch, transform, and filter data
4. **Components**: UI components consume processed data from hooks
5. **Images**: All images served from Cloudflare R2 CDN with immutable caching

### Dataset Structure

The `data/spots.json` file has a metadata wrapper:

```typescript
{
  metadata: {
    total_spots: 26977,
    spots_with_coordinates: 26568,
    spots_with_images: 17989,
    total_image_urls: 37086,
    generated_at: "ISO timestamp",
    source: "calisthenics-parks.com"
  },
  spots: CalisthenicsSpot[]
}
```

### Key Data Transformations

The data goes through these transformations before display:

```
spots.json (with metadata) → API route (extract + clean) → useSpots (fetch) → useSpotsWithDistance (distance calc) → useFilteredSpots (search/filter) → UI components
```

**useSpots**: Fetches spots from `/api/spots` endpoint
**useSpotsWithDistance**: Adds distance calculations when user location is available (uses Haversine formula in `lib/distance.ts`)
**useFilteredSpots**: Applies search queries and equipment filters (bars, rings, track)

### Directory Structure

```
app/
  ├── api/spots/route.ts      # API endpoint serving spot data
  ├── layout.tsx              # Root layout with PWA manifest, fonts
  ├── page.tsx                # Main page with map + list view
  ├── register-sw.tsx         # Service worker registration
  └── spots/[id]/             # Individual spot detail pages
components/
  ├── Map/SpotsMap.tsx        # MapLibre map with markers
  ├── Spots/                  # Spot list and card components
  └── Search/                 # Search bar and quick filters
hooks/
  ├── useSpots.ts             # Fetch spots from API
  ├── useUserLocation.ts      # Get user geolocation
  ├── useSpotsWithDistance.ts # Add distance to spots
  └── useFilteredSpots.ts     # Search and filter logic
lib/
  └── distance.ts             # Haversine distance calculation
data/
  ├── spots.json              # Main spot data (26K+ spots with metadata wrapper)
  └── calisthenics-spots.types.ts  # TypeScript type definitions
real-data/
  ├── backup-images-and-data-20251121.tar.gz  # Backup of images and original JSON
  └── r2-mapping.json         # Cloudflare R2 URL mappings
scripts/
  ├── upload-images-to-r2.ts  # Script to upload images to Cloudflare R2
  └── R2_SETUP.md             # Cloudflare R2 setup documentation
```

### Styling

Uses Tailwind CSS 4 with custom neon-themed design system defined in `app/globals.css`:

- Dark backgrounds: `--bg-app`, `--bg-surface`, `--bg-elevated`
- Neon accents: `--neon-cyan`, `--neon-magenta`, `--neon-purple`, `--neon-blue`, `--neon-lime`
- Responsive mobile-first design with safe area insets for PWA

Custom utility classes include glow effects and animations for the neon aesthetic.

### MapLibre Integration

The map component (`components/Map/SpotsMap.tsx`) uses:

- **Library**: `react-map-gl/maplibre` wrapper around MapLibre GL
- **Base Map**: CartoDB Dark Matter style for dark theme consistency
- **Markers**: Custom markers for spots (💪 emoji) and user location (pulsing cyan dot)
- **Interactions**: Click markers to select spots, map auto-centers on selection or user location

Important: Map requires valid lat/lon coordinates and gracefully handles missing data.

### PWA Configuration

Progressive Web App features:

- **Manifest**: `public/manifest.json` defines app metadata, icons, shortcuts
- **Service Worker**: Currently commented out in `app/register-sw.tsx`
- **Metadata**: SEO, Open Graph, and Apple Web App tags in `app/layout.tsx`

### TypeScript Configuration

Path alias `@/*` maps to project root (configured in `tsconfig.json`). Always use path aliases for imports:

```typescript
// Correct
import { useSpots } from "@/hooks/useSpots";
import type { CalisthenicsSpot } from "@/data/calisthenics-spots.types";

// Incorrect
import { useSpots } from "../../hooks/useSpots";
```

## Working with Spot Data

### Data Schema

See `data/calisthenics-spots.types.ts` for the complete type definition. Key fields:

**CalisthenicsSpot:**
- `id`: Unique numeric identifier
- `title`, `name`: Display names (name is optional)
- `lat`, `lon`: GPS coordinates (optional, nullable - 98.5% of spots have coordinates)
- `address`: Location string (optional)
- `details.equipment`: Array of equipment types (optional - for filtering)
- `details.disciplines`: Types of workouts supported (optional)
- `details.description`: Description text (optional)
- `details.images`: Image URLs from Cloudflare R2 (optional - 67% of spots have images)
- `details.rating`: Quality rating (optional)

**Note:** Most `details` fields are optional since the dataset comes from real-world scraped data with varying completeness.

### Image Storage

All images are hosted on **Cloudflare R2** CDN:
- **URL format**: `https://pub-[bucket-id].r2.dev/images/[spot-id]/image_[n].webp`
- **Caching**: Immutable, 1-year cache headers
- **Total images**: 35,795 WebP images
- **Free tier**: R2 provides unlimited egress (no bandwidth costs)

### Adding New Spots

The dataset is sourced from calisthenics-parks.com and should be treated as read-only in production. To modify:

1. Edit `data/spots.json` (preserving the metadata wrapper structure)
2. Ensure `id` is unique and incremental
3. Include valid `lat`/`lon` for map display
4. API route automatically cleans/normalizes data (removes duplicates, trims whitespace)

### Equipment Filtering

The filter logic (`hooks/useFilteredSpots.ts`) uses fuzzy matching on the optional `equipment` array:

- **Bars**: Matches "bar", "pull-up", "calisthenics park"
- **Rings**: Matches "ring"
- **Track**: Matches "track", "tartan"

When adding equipment types, ensure they match these patterns or update the filter logic. Note that many spots don't have equipment data, so filters may significantly reduce results.

## State Management

No global state library. State is managed through:

1. **Local component state** (`useState`) for UI interactions
2. **Custom hooks** for data fetching and transformations
3. **Props drilling** for parent-child communication

Main state in `app/page.tsx`:
- `searchQuery`: Current search text
- `filters`: Active equipment filters
- `selectedSpotId`: Currently selected spot (syncs map + list)

## Mobile Considerations

- Uses `min-h-dvh` for dynamic viewport height (handles mobile browser chrome)
- Safe area insets configured via CSS variables
- Touch-friendly map controls and markers
- Responsive layout: stacked sections (search → filters → map → list)

## API Routes

### GET /api/spots

Returns normalized spot data array (extracts from metadata wrapper) with caching headers:

```
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
```

Route is force-static (`export const dynamic = "force-static"`), meaning data is cached at build time.

**Processing:**
1. Reads `data/spots.json` with metadata wrapper
2. Extracts `spots` array from dataset
3. Cleans equipment and disciplines arrays (removes empty strings, duplicates)
4. Returns cleaned spots array

## Common Tasks

### Modifying Map Appearance

Edit `components/Map/SpotsMap.tsx`:
- Change base map: Update `mapStyle` prop (must be valid MapLibre style URL)
- Customize markers: Modify JSX in the markers map loop
- Adjust zoom levels: Change `DEFAULT_ZOOM`, `SELECTED_ZOOM` constants

### Adding New Filters

1. Update `FilterOptions` type in `hooks/useFilteredSpots.ts`
2. Add filter logic to the `useFilteredSpots` function
3. Update `components/Search/QuickFilters.tsx` UI
4. Add state to `app/page.tsx`

### Changing Neon Theme

Edit CSS variables in `app/globals.css` under `:root` and `@theme inline` blocks. The neon colors are used throughout via Tailwind utilities (`text-neon-cyan`, `border-neon-magenta`, etc.).

## Image Management (Cloudflare R2)

### Current Setup

Images are hosted on Cloudflare R2 for optimal performance and zero bandwidth costs.

**Configuration:**
- Bucket: Public R2 bucket
- URL: `https://pub-[bucket-id].r2.dev`
- Storage: 3.4GB (35,795 WebP images)
- Cost: Free tier (up to 10GB)

### Re-uploading Images

If you need to upload images to a new R2 bucket:

1. **Setup R2:** Follow instructions in `scripts/R2_SETUP.md`
2. **Configure credentials:** Add to `.env.local`:
   ```bash
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_access_key
   R2_SECRET_ACCESS_KEY=your_secret_key
   R2_BUCKET_NAME=your_bucket_name
   R2_PUBLIC_URL=https://pub-xxx.r2.dev
   ```
3. **Extract backup:** `tar -xzf real-data/backup-images-and-data-20251121.tar.gz -C real-data/`
4. **Upload to R2:** `npx tsx scripts/upload-images-to-r2.ts`
5. **Update spots.json:** Image URLs will be in `real-data/r2-mapping.json`

### Alternative: Use Existing R2 URLs

The current `data/spots.json` already contains R2 URLs. No action needed unless migrating to a different bucket.