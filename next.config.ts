import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
