export interface CalisthenicsSpotDetails {
  equipment?: string[];
  disciplines?: string[];
  description?: string;
  features?: {
    type: string;
  };
  images?: string[];
  rating?: number;
}

export interface CalisthenicsSpot {
  id: number;
  title: string;
  name?: string | null;
  lat?: number;
  lon?: number;
  address?: string;
  details?: CalisthenicsSpotDetails;
}

export type CalisthenicsSpots = CalisthenicsSpot[];

// Dataset with metadata wrapper
export interface DatasetMetadata {
  total_spots: number;
  spots_with_coordinates: number;
  spots_with_address: number;
  spots_with_images: number;
  total_image_urls: number;
  id_range: {
    min: number;
    max: number;
  };
  generated_at: string;
  source: string;
}

export interface CalisthenicsParksDataset {
  metadata: DatasetMetadata;
  spots: CalisthenicsSpot[];
}