# Turso Migration Guide

## Why Turso?

Your app won't load because it's trying to render 27,000 spots at once. Turso fixes this with:
- ✅ **Pagination:** Load 100 spots at a time
- ✅ **Map-bounds filtering:** Only load visible spots
- ✅ **Server-side search:** Fast queries with SQL indexes
- ✅ **Better performance:** Edge database, low latency worldwide

## Setup (5 minutes)

### 1. Install Turso CLI

```bash
# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Or via Homebrew
brew install tursodatabase/tap/turso
```

### 2. Create Database

```bash
# Sign up (opens browser)
turso auth signup

# Create database
turso db create outdoor-workout-spots --location closest

# Get credentials
turso db show outdoor-workout-spots --url
turso db tokens create outdoor-workout-spots
```

### 3. Add Environment Variables

Create `.env.local`:

```bash
TURSO_DATABASE_URL="libsql://outdoor-workout-spots-[your-org].turso.io"
TURSO_AUTH_TOKEN="your-auth-token-here"
```

### 4. Setup & Migrate

```bash
# Create database schema
npm run db:setup

# Migrate all 27K spots (takes ~30 seconds)
npm run db:migrate
```

## What Changes?

### API Routes

**Before:** `/api/spots` (returns all 27K spots)
**After:** `/api/spots-paginated?limit=100&offset=0` (returns 100 spots)

**New Query Parameters:**
- `limit` - Number of spots per page (default: 100, max: 500)
- `offset` - Skip N spots (for pagination)
- `minLat`, `maxLat`, `minLon`, `maxLon` - Map bounds filtering
- `search` - Search by title or address

**Response:**
```json
{
  "spots": [...],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 26977,
    "hasMore": true
  }
}
```

### Frontend Updates Needed

1. **Update `hooks/useSpots.ts`** to use paginated endpoint
2. **Add infinite scroll** or "Load More" button
3. **Add map-bounds filtering** (only load visible spots)

## Benefits

**Before Migration:**
- ❌ 12MB JSON payload
- ❌ 27K DOM nodes rendered
- ❌ Page freezes/crashes
- ❌ Poor mobile performance

**After Migration:**
- ✅ ~100KB initial payload
- ✅ 100 spots rendered at a time
- ✅ Instant page load
- ✅ Great mobile performance
- ✅ Infinite scroll support

## Free Tier

Turso free tier is more than enough:
- 500 databases
- 1 billion row reads/month
- 10 GB storage

Your usage: ~100K reads/month (well within limits)

## Next Steps

After migration:
1. Test pagination in dev
2. Add infinite scroll
3. Add map-bounds filtering
4. Deploy to production

## Rollback

If needed, you can always switch back to static JSON by using `/api/spots` instead of `/api/spots-paginated`.
