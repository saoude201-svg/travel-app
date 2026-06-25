import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sandbox/tunnel previews can't optimize remote images (the optimizer
    // fetches server-side through a restricted proxy). Setting this lets the
    // browser load placeholder images directly. Unset in normal deploys.
    unoptimized: process.env.IMAGE_UNOPTIMIZED === "1",
    remotePatterns: [
      // Placeholder imagery for mock hotel/destination data.
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Google profile photos for OAuth users.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Keep Prisma's generated client + pg out of the server bundle tracing noise.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
