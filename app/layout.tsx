import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import { RegisterServiceWorker } from "./register-sw";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Outdoor Workout Spots - Find Street Workout Places",
  description:
    "Discover outdoor workout spots, calisthenics parks, and street workout locations near you.",
  keywords: [
    "outdoor workout",
    "calisthenics",
    "street workout",
    "fitness",
    "training spots",
  ],
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
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0f1117",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="antialiased h-full">
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
        <Providers>
          <RegisterServiceWorker />
          <main className="h-dvh">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
