import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import type { CalisthenicsSpot } from "@/data/calisthenics-spots.types";

export const dynamic = "force-dynamic";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(process.env.ALLOWED_ORIGINS?.split(",").map(o => o.trim()) || []),
];

// Helper to get allowed origin
function getAllowedOrigin(requestOrigin: string | null): string | null {
  if (!requestOrigin) {
    return null;
  }

  // Allow exact matches
  if (ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }

  // In development, allow any localhost port
  if (process.env.NODE_ENV === "development" && requestOrigin.startsWith("http://localhost:")) {
    return requestOrigin;
  }

  return null;
}

// Zod schema for query parameter validation
const spotsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().max(200).optional(),
  minLat: z.coerce.number().min(-90).max(90).optional(),
  maxLat: z.coerce.number().min(-90).max(90).optional(),
  minLon: z.coerce.number().min(-180).max(180).optional(),
  maxLon: z.coerce.number().min(-180).max(180).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Validate and parse query parameters with Zod
    // Convert null to undefined for optional parameters
    const params = spotsQuerySchema.safeParse({
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      minLat: searchParams.get("minLat") ?? undefined,
      maxLat: searchParams.get("maxLat") ?? undefined,
      minLon: searchParams.get("minLon") ?? undefined,
      maxLon: searchParams.get("maxLon") ?? undefined,
    });

    if (!params.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: params.error.issues,
        },
        { status: 400 }
      );
    }

    const { limit, offset, search, minLat, maxLat, minLon, maxLon } = params.data;

    // Build query with parameterized statements (SQL injection safe)
    let sql = "SELECT * FROM spots WHERE 1=1";
    const args: (string | number)[] = [];

    // Calculate viewport center for distance-based ordering
    let centerLat: number | undefined;
    let centerLon: number | undefined;

    // Filter by map bounds if all coordinates provided and valid
    if (
      minLat !== undefined &&
      maxLat !== undefined &&
      minLon !== undefined &&
      maxLon !== undefined
    ) {
      sql += " AND lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?";
      args.push(minLat, maxLat, minLon, maxLon);

      // Calculate center point for ordering
      centerLat = (minLat + maxLat) / 2;
      centerLon = (minLon + maxLon) / 2;
    }

    // Filter by search query
    if (search) {
      sql += " AND (title LIKE ? OR address LIKE ?)";
      const searchTerm = `%${search}%`;
      args.push(searchTerm, searchTerm);
    }

    // Order by distance from viewport center (prioritize spots near center)
    // Note: This uses a simplified squared Euclidean distance approximation.
    // It does NOT account for:
    // - Earth's curvature (spherical geometry)
    // - Latitude scaling (longitude degrees are shorter at higher latitudes)
    // This is intentional for performance - the approximation is "good enough"
    // for sorting spots within a viewport. For precise distances, use the
    // client-side Haversine calculation in useSpotsWithDistance hook.
    if (centerLat !== undefined && centerLon !== undefined) {
      sql += ` ORDER BY ((lat - ?) * (lat - ?)) + ((lon - ?) * (lon - ?)) ASC`;
      args.push(centerLat, centerLat, centerLon, centerLon);
    } else {
      // Fallback: order by ID for consistent pagination when no bounds
      sql += " ORDER BY id ASC";
    }

    // Add pagination - fetch limit+1 to determine if there are more results
    sql += " LIMIT ? OFFSET ?";
    args.push(limit + 1, offset);

    const result = await db.execute({ sql, args });

    // Check if there are more results
    const hasMore = result.rows.length > limit;

    // Only return 'limit' number of spots (trim the extra one if present)
    const rowsToTransform = result.rows.slice(0, limit);

    // Helper to safely parse JSON fields
    const safeJsonParse = <T>(value: unknown, fallback: T = undefined as T): T => {
      if (!value) return fallback;
      try {
        return JSON.parse(String(value)) as T;
      } catch (error) {
        console.error("JSON parse error for value:", value, error);
        return fallback;
      }
    };

    // Transform rows to CalisthenicsSpot format
    const spots: CalisthenicsSpot[] = rowsToTransform.map((row) => ({
      id: Number(row.id),
      title: String(row.title),
      name: row.name ? String(row.name) : null,
      lat: row.lat !== null ? Number(row.lat) : undefined,
      lon: row.lon !== null ? Number(row.lon) : undefined,
      address: row.address ? String(row.address) : undefined,
      details: {
        equipment: safeJsonParse<string[]>(row.equipment),
        disciplines: safeJsonParse<string[]>(row.disciplines),
        description: row.description ? String(row.description) : undefined,
        features: row.features_type ? { type: String(row.features_type) } : undefined,
        images: safeJsonParse<string[]>(row.images),
        rating: row.rating !== null ? Number(row.rating) : undefined,
      },
    }));

    const response = NextResponse.json(
      {
        spots,
        pagination: {
          limit,
          offset,
          hasMore,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );

    // Add CORS headers with origin allowlist
    const requestOrigin = request.headers.get("origin");
    const allowedOrigin = getAllowedOrigin(requestOrigin);

    if (allowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
      response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    } else if (requestOrigin) {
      // Log rejected origins in development for debugging
      if (process.env.NODE_ENV === "development") {
        console.warn(`CORS: Rejected origin "${requestOrigin}". Add to ALLOWED_ORIGINS env var if needed.`);
      }
      // Note: We don't set CORS headers for disallowed origins
      // The browser will block the request, which is the desired behavior
    }

    return response;
  } catch (error) {
    console.error("Error loading spots:", error);
    return NextResponse.json(
      { error: "Failed to load spots" },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const requestOrigin = request.headers.get("origin");
  const allowedOrigin = getAllowedOrigin(requestOrigin);

  const headers: HeadersInit = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400", // 24 hours
  };

  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
  } else if (requestOrigin && process.env.NODE_ENV === "development") {
    console.warn(`CORS OPTIONS: Rejected origin "${requestOrigin}"`);
  }

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}
