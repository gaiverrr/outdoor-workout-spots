import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RegisterServiceWorker } from "./register-sw";
import FloatingBackgroundLoader from "@/components/UI/FloatingBackgroundLoader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Outdoor Workout Spots - Find Street Workout Places",
  description: "Discover outdoor workout spots, calisthenics parks, and street workout locations near you. Perfect for travelers and fitness enthusiasts.",
  keywords: ["outdoor workout", "calisthenics", "street workout", "fitness", "training spots"],
  authors: [{ name: "Outdoor Workout Spots" }],
  creator: "Outdoor Workout Spots",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    title: "Outdoor Workout Spots",
    description: "Find outdoor workout spots and calisthenics parks near you",
    siteName: "Outdoor Workout Spots",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Workout Spots",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0a0a0f",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="antialiased h-full">
        <FloatingBackgroundLoader />
        <RegisterServiceWorker />
        <div className="grid grid-rows-[auto_1fr] h-dvh relative z-10">
          {/* Top Navigation - Auto height */}
          <header className="sticky top-0 z-50 glass border-b border-neon-cyan/20">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <h1 className="text-xl font-bold uppercase tracking-wider">
                <span className="text-neon-cyan">
                  Outdoor Workout Spots
                </span>
              </h1>
              <div className="text-xs font-mono text-text-secondary">
                BETA
              </div>
            </div>
          </header>

          {/* Main Content - Takes remaining 1fr of viewport height */}
          <main className="overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
