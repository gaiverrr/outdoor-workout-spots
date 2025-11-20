import { notFound } from "next/navigation";
import type { CalisthenicsSpot } from "@/data/calisthenics-spots.types";
import spotsData from "@/data/spots.json";
import { SpotDetailClient } from "./SpotDetailClient";

export async function generateStaticParams() {
  const spots = spotsData as CalisthenicsSpot[];
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
  const spots = spotsData as CalisthenicsSpot[];
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
  const spots = spotsData as CalisthenicsSpot[];
  const spot = spots.find((s) => s.id === parseInt(id));

  if (!spot) {
    notFound();
  }

  return <SpotDetailClient spot={spot} />;
}
