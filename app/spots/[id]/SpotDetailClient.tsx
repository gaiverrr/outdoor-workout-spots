"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Map, { Marker } from "react-map-gl/maplibre";
import type { CalisthenicsSpot } from "@/data/calisthenics-spots.types";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getDistanceKm, formatDistance } from "@/lib/distance";
import "maplibre-gl/dist/maplibre-gl.css";

interface SpotDetailClientProps {
  spot: CalisthenicsSpot;
}

export function SpotDetailClient({ spot }: SpotDetailClientProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const { location: userLocation } = useUserLocation();

  const distance =
    userLocation && spot.lat != null && spot.lon != null
      ? getDistanceKm(userLocation, { lat: spot.lat, lon: spot.lon })
      : null;

  const images = spot.details?.images || [];
  const equipment = spot.details?.equipment || [];
  const description = spot.details?.description || "";

  return (
    <div className="min-h-dvh bg-app">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-app/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          data-testid="back-button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: spot.title, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          data-testid="share-button"
        >
          Share
        </button>
      </header>

      {/* Hero image */}
      {images.length > 0 && !imageError[0] ? (
        <div className="w-full aspect-video bg-elevated relative">
          <Image
            src={images[0]}
            alt={spot.title}
            fill
            className="object-cover"
            onError={() => setImageError((prev) => ({ ...prev, [0]: true }))}
            priority
          />
        </div>
      ) : spot.lat != null && spot.lon != null ? (
        <div className="w-full aspect-video">
          <Map
            initialViewState={{ longitude: spot.lon, latitude: spot.lat, zoom: 14 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            attributionControl={false}
            interactive={false}
          >
            <Marker longitude={spot.lon} latitude={spot.lat} anchor="center">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-white text-xs">💪</span>
              </div>
            </Marker>
          </Map>
        </div>
      ) : null}

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Title */}
        <h1 className="text-2xl font-bold text-text-primary mb-1" data-testid="spot-title">
          {spot.title}
        </h1>

        {/* Address */}
        {spot.address && (
          <p className="text-sm text-text-secondary mb-3">{spot.address}</p>
        )}

        {/* Rating + Distance */}
        <div className="flex items-center gap-3 mb-4">
          {spot.details?.rating != null && (
            <span className="text-sm text-text-secondary">
              Rating: {spot.details.rating}/100
            </span>
          )}
          {distance != null && (
            <span className="text-sm font-medium text-accent-secondary">
              {formatDistance(distance)} away
            </span>
          )}
        </div>

        {/* Equipment */}
        {equipment.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {equipment.map((item, i) => (
              <span
                key={`${item}-${i}`}
                className="px-3 py-1.5 bg-elevated border border-border rounded-lg text-sm text-text-secondary"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {description && (
          <div className="mb-6">
            <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
          </div>
        )}

        {/* Photo gallery */}
        {images.length > 1 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Photos</h2>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x">
              {images.slice(1).map((url, i) => (
                <div key={i} className="flex-shrink-0 w-60 h-40 snap-start rounded-lg overflow-hidden bg-elevated">
                  {!imageError[i + 1] ? (
                    <Image
                      src={url}
                      alt={`${spot.title} - ${i + 2}`}
                      width={240}
                      height={160}
                      className="w-full h-full object-cover"
                      onError={() => setImageError((prev) => ({ ...prev, [i + 1]: true }))}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-dim text-sm">
                      Unavailable
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mini map + directions */}
        {spot.lat != null && spot.lon != null && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Location</h2>
            <div className="h-48 rounded-xl overflow-hidden border border-border mb-3">
              <Map
                initialViewState={{ longitude: spot.lon, latitude: spot.lat, zoom: 14 }}
                style={{ width: "100%", height: "100%" }}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                attributionControl={false}
                interactive={false}
              >
                <Marker longitude={spot.lon} latitude={spot.lat} anchor="center">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-white text-xs">💪</span>
                  </div>
                </Marker>
              </Map>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3 bg-accent text-white font-medium rounded-lg
                hover:bg-accent-hover transition-colors duration-150"
              data-testid="open-google-maps"
            >
              Open in Google Maps
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
