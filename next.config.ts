import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Modern formats first. Product photography is the heaviest payload on this
  // site, so AVIF is worth the extra encode time.
  images: {
    formats: ["image/avif", "image/webp"],
    // Added when the CMS starts serving media from the WordPress origin.
    remotePatterns: [],
  },

  // three.js ships a large ESM surface; letting Next optimise the barrel
  // imports keeps the client bundle from pulling in the whole library.
  experimental: {
    optimizePackageImports: ["three", "@react-three/drei", "motion"],
  },
};

export default nextConfig;
