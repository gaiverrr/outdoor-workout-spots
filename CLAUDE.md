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

# Database commands
npm run db:setup      # Create Turso database schema
npm run db:migrate    # Migrate spots data to Turso
```

## Architecture

### Data Flow

The app uses a modern client-server architecture with edge database and query caching:

1. **Data Source**:
   - **Production**: Turso edge SQLite database (26,977 spots indexed by ID, lat/lon, title)
   - **Backup**: Static JSON dataset (`data/spots.json`) with metadata wrapper
2. **API Layer**: Next.js API route (`app/api/spots/route.ts`) queries Turso with pagination, filtering, and search
3. **Query Layer**: TanStack Query (React Query) handles caching, background refetching, and infinite scroll
4. **Custom Hooks**: React hooks transform and filter data (distance calculations, equipment filtering)
5. **Components**: UI components consume processed data from hooks
6. **Images**: All images served from Cloudflare R2 CDN with immutable caching

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
Turso DB → API route (paginated SQL query) → TanStack Query (cache + infinite scroll) → useSpotsInfinite → useSpotsWithDistance (distance calc) → useFilteredSpots (filter) → UI components
```

**Database Layer (Turso):**
- SQLite database with indexes on `id` (PRIMARY KEY), `lat/lon`, and `title`
- Batch transactions with upsert (`INSERT OR REPLACE`) for data integrity
- Edge deployment for low-latency global access

**Query Layer (TanStack Query):**
- Automatic request caching (1 min stale time, 5 min garbage collection)
- Request deduplication
- Background refetching
- Optimistic updates support

**Data Hooks:**
- `useSpotsInfinite`: Fetches paginated spots using `useInfiniteQuery` (100 spots per page, infinite scroll)
- `useUserLocation`: Gets user geolocation with React Query caching (5 min cache)
- `useSpotsWithDistance`: Adds distance calculations when user location is available (Haversine formula in `lib/distance.ts`)
- `useFilteredSpots`: Applies client-side search and equipment filters (bars, rings, track)

### Directory Structure

```
app/
  ├── api/spots/route.ts      # Paginated API endpoint querying Turso
  ├── layout.tsx              # Root layout with PWA manifest, TanStack Query provider
  ├── page.tsx                # Main page with map + infinite scroll list
  ├── providers.tsx           # TanStack Query client provider
  ├── register-sw.tsx         # Service worker registration
  └── spots/[id]/             # Individual spot detail pages
components/
  ├── Map/SpotsMap.tsx        # MapLibre map with markers
  ├── Spots/                  # Spot list and card components
  └── Search/                 # Search bar and quick filters
hooks/
  ├── useSpotsInfinite.ts     # Infinite scroll with TanStack Query
  ├── useUserLocation.ts      # User geolocation with React Query caching
  ├── useSpotsWithDistance.ts # Add distance calculations to spots
  └── useFilteredSpots.ts     # Client-side search and filter logic
lib/
  ├── db.ts                   # Turso database client
  └── distance.ts             # Haversine distance calculation
data/
  ├── spots.json              # Backup JSON data (26,977 spots with metadata)
  └── calisthenics-spots.types.ts  # TypeScript type definitions
real-data/
  ├── backup-images-and-data-20251121.tar.gz  # Backup of images and original JSON
  └── r2-mapping.json         # Cloudflare R2 URL mappings
scripts/
  ├── create-schema.ts        # Create Turso database schema
  ├── migrate-to-turso.ts     # Migrate JSON data to Turso (batch + upsert)
  ├── check-data.ts           # Data quality validation script
  ├── upload-images-to-r2.ts  # Upload images to Cloudflare R2
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

State is managed through a combination of server state (TanStack Query) and local UI state:

1. **Server State** (TanStack Query):
   - Automatic caching and background refetching
   - Query invalidation and optimistic updates
   - Infinite scroll pagination state
   - User location caching (5 min stale time)

2. **Local UI State** (`useState`):
   - Search query text
   - Equipment filters
   - Selected spot ID (syncs map + list)
   - UI toggle states

3. **Props drilling** for parent-child communication

Main state in `app/page.tsx`:
- `searchQuery`: Current search text (passed to `useSpotsInfinite`)
- `filters`: Active equipment filters (client-side filtering)
- `selectedSpotId`: Currently selected spot (syncs map + list highlighting)

## Mobile Considerations

- Uses `min-h-dvh` for dynamic viewport height (handles mobile browser chrome)
- Safe area insets configured via CSS variables
- Touch-friendly map controls and markers
- Responsive layout: stacked sections (search → filters → map → list)

## API Routes

### GET /api/spots

**Paginated endpoint** querying Turso database with support for filtering and search.

**Query Parameters:**
- `limit` (optional): Number of spots per page (default: 100, max: 500)
- `offset` (optional): Pagination offset (default: 0)
- `search` (optional): Search query for title/address
- `minLat`, `maxLat`, `minLon`, `maxLon` (optional): Map bounds filtering

**Response:**
```json
{
  "spots": CalisthenicsSpot[],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 26977,
    "hasMore": true
  }
}
```

**Caching:**
```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

**Configuration:**
- Route is force-dynamic (`export const dynamic = "force-dynamic"`)
- Uses prepared statements with parameter binding for SQL injection protection
- Indexes on `id` (PRIMARY KEY), `lat/lon`, and `title` for fast queries

**Processing:**
1. Parses query parameters (limit, offset, search, bounds)
2. Builds SQL query with optional filters
3. Executes query on Turso database
4. Transforms database rows to `CalisthenicsSpot` format (deserializes JSON fields)
5. Returns paginated results with metadata

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

## Database (Turso)

### Overview

The app uses **Turso** as the production database - an edge SQLite database with global replication for low-latency access.

**Why Turso:**
- Edge deployment (data close to users globally)
- SQLite compatibility (familiar, powerful)
- Built-in replication and backups
- Generous free tier (9GB storage, 1 billion row reads/month)
- LibSQL protocol for efficient queries

### Database Schema

```sql
CREATE TABLE spots (
  id INTEGER PRIMARY KEY,           -- Unique spot ID (prevents duplicates)
  title TEXT NOT NULL,              -- Display title (required)
  name TEXT,                        -- Alternative name (optional)
  lat REAL,                         -- Latitude (98.5% have coords)
  lon REAL,                         -- Longitude
  address TEXT,                     -- Location string
  equipment TEXT,                   -- JSON array of equipment types
  disciplines TEXT,                 -- JSON array of workout disciplines
  description TEXT,                 -- Description text
  features_type TEXT,               -- Feature category
  images TEXT,                      -- JSON array of R2 image URLs
  rating INTEGER                    -- Quality rating (1-5)
);

-- Indexes for performance
CREATE INDEX idx_lat_lon ON spots(lat, lon);  -- Map viewport queries
CREATE INDEX idx_title ON spots(title);        -- Text search
```

### Database Setup

**Initial Setup:**
```bash
# Create schema in Turso
npm run db:setup

# Migrate all spots from JSON to Turso
npm run db:migrate
```

**Environment Variables (.env.local):**
```bash
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_auth_token
```

### Migration Script

The migration script (`scripts/migrate-to-turso.ts`) uses:
- **Batch transactions**: 500 spots per batch for speed
- **Upsert pattern**: `INSERT OR REPLACE` prevents duplicates
- **Retry logic**: Exponential backoff for network timeouts
- **Data validation**: Fallback to `name` if `title` is missing
- **Progress tracking**: Real-time progress display

**Features:**
- Migrates 26,977 spots in ~40-50 seconds
- Safe to re-run (idempotent with upsert)
- Handles network interruptions with retries
- Validates data quality before insertion

## TanStack Query Integration

### Why TanStack Query

The app uses **TanStack Query** (React Query) for all server state management:

**Benefits:**
- Automatic request caching and deduplication
- Background refetching keeps data fresh
- Optimistic updates support
- Built-in loading and error states
- Infinite scroll pagination
- Request retry with exponential backoff

### Query Configuration

**Global defaults** (`app/providers.tsx`):
```typescript
{
  staleTime: 60 * 1000,      // 1 minute (how long data is "fresh")
  gcTime: 5 * 60 * 1000,     // 5 minutes (cache lifetime)
  refetchOnWindowFocus: false,
  retry: 1                    // Retry failed requests once
}
```

### Usage Example

```typescript
// Infinite scroll with pagination
const {
  spots,
  loading,
  loadMore,
  hasMore
} = useSpotsInfinite({ limit: 100, searchQuery });

// User location with caching
const {
  location,
  status,
  requestLocation
} = useUserLocation();
```

### DevTools (Development)

To add React Query DevTools for debugging:
```bash
npm install @tanstack/react-query-devtools
```

Then import in `app/providers.tsx`:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Add inside QueryClientProvider
<ReactQueryDevtools initialIsOpen={false} />
```