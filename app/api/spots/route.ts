import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import type { CalisthenicsSpot } from "@/data/calisthenics-spots.types";

export const dynamic = "force-dynamic";

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
    // Rate limiting (100 requests per minute per IP)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateLimit = checkRateLimit(ip, { limit: 100, window: 60 * 1000 });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(rateLimit.reset).toISOString(),
            "Retry-After": String(Math.ceil((rateLimit.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    // Validate and parse query parameters with Zod
    const params = spotsQuerySchema.safeParse({
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
      search: searchParams.get("search"),
      minLat: searchParams.get("minLat"),
      maxLat: searchParams.get("maxLat"),
      minLon: searchParams.get("minLon"),
      maxLon: searchParams.get("maxLon"),
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

    // Filter by map bounds if all coordinates provided and valid
    if (
      minLat !== undefined &&
      maxLat !== undefined &&
      minLon !== undefined &&
      maxLon !== undefined
    ) {
      sql += " AND lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?";
      args.push(minLat, maxLat, minLon, maxLon);
    }

    // Filter by search query
    if (search) {
      sql += " AND (title LIKE ? OR address LIKE ?)";
      const searchTerm = `%${search}%`;
      args.push(searchTerm, searchTerm);
    }

    // Add pagination
    sql += " LIMIT ? OFFSET ?";
    args.push(limit, offset);

    const result = await db.execute({ sql, args });

    // Transform rows to CalisthenicsSpot format
    const spots: CalisthenicsSpot[] = result.rows.map((row) => ({
      id: Number(row.id),
      title: String(row.title),
      name: row.name ? String(row.name) : null,
      lat: row.lat !== null ? Number(row.lat) : undefined,
      lon: row.lon !== null ? Number(row.lon) : undefined,
      address: row.address ? String(row.address) : undefined,
      details: {
        equipment: row.equipment ? JSON.parse(String(row.equipment)) : undefined,
        disciplines: row.disciplines ? JSON.parse(String(row.disciplines)) : undefined,
        description: row.description ? String(row.description) : undefined,
        features: row.features_type ? { type: String(row.features_type) } : undefined,
        images: row.images ? JSON.parse(String(row.images)) : undefined,
        rating: row.rating !== null ? Number(row.rating) : undefined,
      },
    }));

    // Get total count (for pagination UI)
    let countSql = "SELECT COUNT(*) as total FROM spots WHERE 1=1";
    const countArgs: (string | number)[] = [];

    if (
      minLat !== undefined &&
      maxLat !== undefined &&
      minLon !== undefined &&
      maxLon !== undefined
    ) {
      countSql += " AND lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?";
      countArgs.push(minLat, maxLat, minLon, maxLon);
    }

    if (search) {
      countSql += " AND (title LIKE ? OR address LIKE ?)";
      const searchTerm = `%${search}%`;
      countArgs.push(searchTerm, searchTerm);
    }

    const countResult = await db.execute({ sql: countSql, args: countArgs });
    const total = Number(countResult.rows[0]?.total) || 0;

    const response = NextResponse.json(
      {
        spots,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + spots.length < total,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": new Date(rateLimit.reset).toISOString(),
        },
      }
    );

    // Add CORS headers (allow same-origin by default)
    response.headers.set("Access-Control-Allow-Origin", request.headers.get("origin") || "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

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
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400", // 24 hours
    },
  });
}
