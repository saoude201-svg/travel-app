import type { HotelProvider } from "./types";
import { MockHotelProvider } from "./mock";
import { RealHotelProvider } from "./real";

export * from "./types";

let cached: HotelProvider | null = null;

/**
 * Returns the configured hotel inventory provider. Selected by the
 * `HOTEL_PROVIDER` env flag (`mock` | `real`), defaulting to `mock` so the app
 * is fully usable with no partner keys. See README to switch to a live API.
 */
export function getHotelProvider(): HotelProvider {
  if (cached) return cached;
  const choice = (process.env.HOTEL_PROVIDER ?? "mock").toLowerCase();
  cached = choice === "real" ? new RealHotelProvider() : new MockHotelProvider();
  return cached;
}

/** Test seam — reset the memoized provider between tests. */
export function __resetHotelProvider() {
  cached = null;
}
