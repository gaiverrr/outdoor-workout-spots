import { NextResponse } from "next/server";
import type { CalisthenicsParksDataset } from "@/data/calisthenics-spots.types";
import spotsData from "@/data/spots.json";

export const dynamic = "force-static";

export async function GET() {
  try {
    // Type assertion for the imported JSON with metadata wrapper
    const dataset = spotsData as CalisthenicsParksDataset;
    const spots = dataset.spots;

    // Clean and normalize the data
    const cleanedSpots = spots.map((spot) => ({
      ...spot,
      details: spot.details
        ? {
            ...spot.details,
            // Remove empty strings and duplicates from equipment (if exists)
            equipment: spot.details.equipment
              ? Array.from(
                  new Set(spot.details.equipment.filter((item) => item.trim() !== ""))
                )
              : undefined,
            // Remove empty strings and duplicates from disciplines (if exists)
            disciplines: spot.details.disciplines
              ? Array.from(
                  new Set(spot.details.disciplines.filter((item) => item.trim() !== ""))
                )
              : undefined,
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
