import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-d66e489f303343368ae2cef3780603d9.r2.dev",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
