"use client";

export interface MapPoint {
  lat: number;
  lng: number;
  name: string;
}

/**
 * Lightweight, key-free map via the OpenStreetMap embed. Centers on the mean
 * of the result coordinates. For per-pin maps later, swap in Leaflet/MapLibre
 * — the provider DTOs already carry lat/lng.
 */
export function HotelMap({ points }: { points: MapPoint[] }) {
  if (!points.length) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-xl border bg-secondary/30 text-sm text-muted-foreground">
        No locations to show.
      </div>
    );
  }

  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  const d = 0.08;
  const bbox = [lng - d, lat - d, lng + d, lat + d].join(",");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="overflow-hidden rounded-xl border">
      <iframe
        title="Map of search results"
        src={src}
        className="h-[60vh] w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
