import { notFound } from "next/navigation";
import type { CalisthenicsSpot } from "@/data/calisthenics-spots.types";
import { db } from "@/lib/db";
import { SpotDetailClient } from "./SpotDetailClient";

// Allow rendering pages that weren't pre-generated
export const dynamicParams = true;

// Use Incremental Static Regeneration (ISR)
// Pages will be generated on-demand and cached for 1 hour
export const revalidate = 3600;

async function getSpotById(id: string): Promise<CalisthenicsSpot | null> {
  try {
    const result = await db.execute({
      sql: "SELECT * FROM spots WHERE id = ?",
      args: [parseInt(id)],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
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
    };
  } catch (error) {
    console.error("Error fetching spot:", error);
    return null;
  }
}

export async function generateStaticParams() {
  // Don't pre-generate any pages to avoid Vercel's 75MB deployment limit
  // With ISR (revalidate = 3600), pages will be generated on-demand
  // and cached for 1 hour, providing good performance without the huge bundle
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const spot = await getSpotById(id);

  if (!spot) {
    return {
      title: "Spot Not Found",
    };
  }

  return {
    title: `${spot.title} - Outdoor Workout Spots`,
    description:
      spot.details?.description || `Outdoor workout spot: ${spot.title}`,
  };
}

export default async function SpotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const spot = await getSpotById(id);

  if (!spot) {
    notFound();
  }

  return <SpotDetailClient spot={spot} />;
}
