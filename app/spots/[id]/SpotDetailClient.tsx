"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CalisthenicsSpot } from "@/data/calisthenics-spots.types";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getDistanceKm, formatDistance } from "@/lib/distance";

export interface SpotDetailClientProps {
  spot: CalisthenicsSpot;
}

export function SpotDetailClient({ spot }: SpotDetailClientProps) {
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { location: userLocation } = useUserLocation();

  const distance =
    userLocation && spot.lat != null && spot.lon != null
      ? getDistanceKm(userLocation, { lat: spot.lat, lon: spot.lon })
      : null;

  const images = spot.details?.images || [];
  const equipment = spot.details?.equipment || [];
  const disciplines = spot.details?.disciplines || [];
  const description = spot.details?.description || "";
  const needsTruncation = description.length > 180;

  const handleOpenMaps = () => {
    if (spot.lat == null || spot.lon == null) return;

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const mapsUrl = isIOS
      ? `maps://maps.apple.com/?q=${spot.lat},${spot.lon}`
      : `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lon}`;

    window.open(mapsUrl, "_blank");
  };

  const handleCopyAddress = async () => {
    if (!spot.address) return;
    try {
      await navigator.clipboard.writeText(spot.address);
      // Could add toast notification here
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-app">
      {/* Back Button */}
      <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur-md border-b border-neon-cyan/20 p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neon-cyan hover:text-neon-magenta transition-colors"
        >
          <span className="text-xl">←</span>
          <span className="font-medium">Back to map</span>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 pr-4">
              <h1 className="text-3xl font-bold text-text-primary mb-2 break-words">
                {spot.title}
              </h1>
              {spot.name && spot.name !== spot.title && (
                <p className="text-lg text-text-secondary">{spot.name}</p>
              )}
            </div>
            {distance != null && (
              <div className="flex-shrink-0">
                <span className="px-3 py-2 bg-neon-cyan/20 border border-neon-cyan/40 rounded-lg text-sm font-mono font-bold text-neon-cyan">
                  {formatDistance(distance)}
                </span>
              </div>
            )}
          </div>

          {spot.address && (
            <p className="text-text-secondary mb-3">{spot.address}</p>
          )}

          {spot.details?.rating != null && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-neon-horizontal"
                  style={{ width: `${spot.details.rating}%` }}
                />
              </div>
              <span className="text-sm font-mono text-text-secondary font-bold">
                {spot.details.rating}/100
              </span>
            </div>
          )}
        </header>

        {/* Image Gallery */}
        {images.length > 0 && (
          <section className="mb-6">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
              {images.map((url, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-[85%] sm:w-96 h-64 snap-start glass rounded-xl overflow-hidden border border-neon-cyan/20"
                >
                  {!imageError[index] ? (
                    <Image
                      src={url}
                      alt={`${spot.title} - Image ${index + 1}`}
                      width={384}
                      height={256}
                      className="w-full h-full object-cover"
                      onError={() =>
                        setImageError((prev) => ({ ...prev, [index]: true }))
                      }
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-elevated">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🖼️</div>
                        <p className="text-text-dim text-sm">
                          Image unavailable
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Equipment */}
        {equipment.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-bold text-text-primary mb-3">
              <span className="text-glow-cyan">Equipment</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {equipment.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="px-3 py-2 bg-neon-purple/10 border border-neon-purple/30 rounded-lg text-sm font-medium text-neon-purple"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Disciplines */}
        {disciplines.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-bold text-text-primary mb-3">
              <span className="text-glow-magenta">Disciplines</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {disciplines.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="px-3 py-2 bg-neon-magenta/10 border border-neon-magenta/30 rounded-lg text-sm font-medium text-neon-magenta"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Description */}
        {description && (
          <section className="mb-6">
            <h2 className="text-xl font-bold text-text-primary mb-3">About</h2>
            <div className="glass p-4 rounded-xl border border-neon-cyan/20">
              <p className="text-text-secondary leading-relaxed">
                {needsTruncation && !showFullDescription
                  ? `${description.slice(0, 180)}...`
                  : description}
              </p>
              {needsTruncation && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-2 text-neon-cyan hover:text-neon-magenta transition-colors text-sm font-medium"
                >
                  {showFullDescription ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          </section>
        )}

        {/* Actions */}
        {spot.lat != null && spot.lon != null && (
          <section className="mb-6">
            <h2 className="text-xl font-bold text-text-primary mb-3">
              Actions
            </h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleOpenMaps}
                className="w-full px-6 py-4 bg-gradient-neon rounded-xl font-bold text-white border-2 border-transparent hover:border-white transition-all hover:scale-[1.02]"
              >
                📍 Open in Maps
              </button>
              {spot.address && (
                <button
                  onClick={handleCopyAddress}
                  className="w-full px-6 py-4 glass rounded-xl font-medium text-text-primary border border-neon-cyan/40 hover:border-neon-cyan transition-all"
                >
                  📋 Copy Address
                </button>
              )}
            </div>
          </section>
        )}

        {/* Feature Type */}
        {spot.details?.features?.type && (
          <section className="mb-6">
            <div className="glass p-4 rounded-xl border border-neon-cyan/20 text-center">
              <span className="text-sm font-mono text-text-secondary">
                Type: {spot.details.features.type}
              </span>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
