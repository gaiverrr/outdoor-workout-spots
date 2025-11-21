import { NextResponse } from "next/server";
import type { CalisthenicsSpot } from "@/data/calisthenics-spots.types";
import spotsData from "@/data/spots.json";

export const dynamic = "force-static";

export async function GET() {
  try {
    // Type assertion for the imported JSON
    const spots = spotsData as CalisthenicsSpot[];

    // Clean and normalize the data
    const cleanedSpots = spots.map((spot) => ({
      ...spot,
      details: spot.details
        ? {
            ...spot.details,
            // Remove empty strings and duplicates from equipment
            equipment: Array.from(
              new Set(spot.details.equipment.filter((item) => item.trim() !== ""))
            ),
            // Remove empty strings and duplicates from disciplines
            disciplines: Array.from(
              new Set(spot.details.disciplines.filter((item) => item.trim() !== ""))
            ),
          }
        : undefined,
    }));

    return NextResponse.json(cleanedSpots, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error loading spots data:", error);
    return NextResponse.json(
      { error: "Failed to load spots data" },
      { status: 500 }
    );
  }
}
