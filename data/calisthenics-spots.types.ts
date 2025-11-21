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