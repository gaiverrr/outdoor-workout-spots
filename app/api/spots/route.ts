import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { CalisthenicsSpot } from "@/data/calisthenics-spots.types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination params with validation
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") || "100") || 100),
      500
    );
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0") || 0);

    // Map bounds for filtering (only load visible spots)
    const minLatParam = searchParams.get("minLat");
    const maxLatParam = searchParams.get("maxLat");
    const minLonParam = searchParams.get("minLon");
    const maxLonParam = searchParams.get("maxLon");

    const minLat = minLatParam ? parseFloat(minLatParam) : null;
    const maxLat = maxLatParam ? parseFloat(maxLatParam) : null;
    const minLon = minLonParam ? parseFloat(minLonParam) : null;
    const maxLon = maxLonParam ? parseFloat(maxLonParam) : null;

    // Search query
    const search = searchParams.get("search");

    // Build query
    let sql = "SELECT * FROM spots WHERE 1=1";
    const args: (string | number)[] = [];

    // Filter by map bounds if provided
    if (minLat !== null && maxLat !== null && minLon !== null && maxLon !== null &&
        !isNaN(minLat) && !isNaN(maxLat) && !isNaN(minLon) && !isNaN(maxLon)) {
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

    if (minLat !== null && maxLat !== null && minLon !== null && maxLon !== null &&
        !isNaN(minLat) && !isNaN(maxLat) && !isNaN(minLon) && !isNaN(maxLon)) {
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

    return NextResponse.json({
      spots,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + spots.length < total,
      },
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error loading spots:", error);
    return NextResponse.json(
      { error: "Failed to load spots" },
      { status: 500 }
    );
  }
}
