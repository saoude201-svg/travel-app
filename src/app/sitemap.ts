import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  const [destinations, hotels] = await Promise.all([
    db.destination.findMany({ select: { slug: true } }),
    db.hotel.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  const staticRoutes = ["", "/hotels", "/destinations", "/suggestions"].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...destinations.map((d) => ({ url: `${base}/hotels?destination=${d.slug}`, lastModified: new Date() })),
    ...hotels.map((h) => ({ url: `${base}/hotels/${h.slug}`, lastModified: h.updatedAt })),
  ];
}
