import { notFound } from "next/navigation";
import type { CalisthenicsParksDataset } from "@/data/calisthenics-spots.types";
import spotsData from "@/data/spots.json";
import { SpotDetailClient } from "./SpotDetailClient";

// Extract spots from dataset
const dataset = spotsData as CalisthenicsParksDataset;
const spots = dataset.spots;

// Allow rendering pages that weren't pre-generated
export const dynamicParams = true;

export async function generateStaticParams() {
  // Only generate static pages for production builds
  // For preview/dev, use on-demand rendering to speed up builds
  if (process.env.VERCEL_ENV !== 'production') {
    return [];
  }

  return spots.map((spot) => ({
    id: spot.id.toString(),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const spot = spots.find((s) => s.id === parseInt(id));

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
  const spot = spots.find((s) => s.id === parseInt(id));

  if (!spot) {
    notFound();
  }

  return <SpotDetailClient spot={spot} />;
}
