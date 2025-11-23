import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { CalisthenicsSpot } from "@/data/calisthenics-spots.types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination params
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Map bounds for filtering (only load visible spots)
    const minLat = searchParams.get("minLat");
    const maxLat = searchParams.get("maxLat");
    const minLon = searchParams.get("minLon");
    const maxLon = searchParams.get("maxLon");

    // Search query
    const search = searchParams.get("search");

    // Build query
    let sql = "SELECT * FROM spots WHERE 1=1";
    const args: (string | number)[] = [];

    // Filter by map bounds if provided
    if (minLat && maxLat && minLon && maxLon) {
      sql += " AND lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?";
      args.push(parseFloat(minLat), parseFloat(maxLat), parseFloat(minLon), parseFloat(maxLon));
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
      id: row.id,
      title: row.title,
      name: row.name,
      lat: row.lat,
      lon: row.lon,
      address: row.address,
      details: {
        equipment: row.equipment ? JSON.parse(row.equipment) : undefined,
        disciplines: row.disciplines ? JSON.parse(row.disciplines) : undefined,
        description: row.description,
        features: row.features_type ? { type: row.features_type } : undefined,
        images: row.images ? JSON.parse(row.images) : undefined,
        rating: row.rating,
      },
    }));

    // Get total count (for pagination UI)
    let countSql = "SELECT COUNT(*) as total FROM spots WHERE 1=1";
    const countArgs: (string | number)[] = [];

    if (minLat && maxLat && minLon && maxLon) {
      countSql += " AND lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?";
      countArgs.push(parseFloat(minLat), parseFloat(maxLat), parseFloat(minLon), parseFloat(maxLon));
    }

    if (search) {
      countSql += " AND (title LIKE ? OR address LIKE ?)";
      const searchTerm = `%${search}%`;
      countArgs.push(searchTerm, searchTerm);
    }

    const countResult = await db.execute({ sql: countSql, args: countArgs });
    const total = countResult.rows[0]?.total || 0;

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
