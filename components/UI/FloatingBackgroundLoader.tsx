"use client";

import dynamic from "next/dynamic";

/**
 * Client-side wrapper for lazy loading FloatingBackground component
 * This reduces initial bundle size by ~940KB since Three.js is only loaded when needed
 */
const FloatingBackground = dynamic(
  () => import("@/components/UI/FloatingBackground"),
  {
    ssr: false, // Don't render on server (requires window/document)
    loading: () => null, // Show nothing while loading
  }
);

export default function FloatingBackgroundLoader() {
  return <FloatingBackground />;
}
