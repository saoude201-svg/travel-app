import path from "node:path";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { destinations, type SeedVibe } from "./seed-data/destinations";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  /* env may be injected by the environment */
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// --- Deterministic PRNG so repeated seeds produce stable data ---------------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260625);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1));
const sample = <T>(arr: T[], n: number): T[] =>
  [...arr].sort(() => rand() - 0.5).slice(0, n);

const img = (seed: string) => `https://picsum.photos/seed/${seed}/1200/800`;

// --- Pools ------------------------------------------------------------------
const HOTEL_PREFIXES = [
  "The", "Hotel", "Casa", "Villa", "Grand", "Maison", "The Old", "Riad",
];
const HOTEL_CORES = [
  "Azure", "Lumière", "Meridian", "Aurora", "Verde", "Soleil", "Mirador",
  "Cascade", "Belrose", "Atlas", "Marble", "Lagoon", "Cedar", "Onyx",
  "Saffron", "Tramonto", "Northwind", "Halcyon",
];
const HOTEL_SUFFIXES = [
  "Hotel & Spa", "Boutique Hotel", "Resort", "Retreat", "House", "Suites",
  "Lodge", "Collection", "Residences", "Inn",
];

const AMENITIES = [
  "Free WiFi", "Outdoor pool", "Spa & wellness", "Fitness center",
  "Free breakfast", "Airport shuttle", "Restaurant", "Rooftop bar",
  "Air conditioning", "Pet friendly", "Family rooms", "Beachfront",
  "Free parking", "Concierge", "Room service", "Hot tub", "Sauna",
  "Bicycle rental", "Business center", "EV charging",
];

const ROOM_TEMPLATES = [
  { name: "Standard Queen", bedConfig: "1 queen bed", maxOccupancy: 2, sizeSqm: 22, mult: 1.0 },
  { name: "Deluxe King", bedConfig: "1 king bed", maxOccupancy: 2, sizeSqm: 30, mult: 1.35 },
  { name: "Twin Room", bedConfig: "2 single beds", maxOccupancy: 2, sizeSqm: 24, mult: 1.05 },
  { name: "Family Suite", bedConfig: "1 king + 2 singles", maxOccupancy: 4, sizeSqm: 48, mult: 1.9 },
  { name: "Junior Suite", bedConfig: "1 king bed + sofa", maxOccupancy: 3, sizeSqm: 40, mult: 1.6 },
  { name: "Sea View Suite", bedConfig: "1 king bed", maxOccupancy: 2, sizeSqm: 44, mult: 2.2 },
];

const ROOM_AMENITIES = [
  "Air conditioning", "Free WiFi", "Minibar", "Nespresso machine", "Safe",
  "Bathrobe & slippers", "Smart TV", "Rain shower", "Balcony", "Blackout curtains",
];

const REVIEW_AUTHORS = [
  "Amelia R.", "Daniel K.", "Sofia M.", "Liam T.", "Yuki N.", "Carlos B.",
  "Hannah W.", "Marco P.", "Priya S.", "Noah F.", "Elena V.", "Tom H.",
];
const REVIEW_TITLES = [
  "Exactly what we hoped for", "A dreamy stay", "Great location, lovely staff",
  "Would book again", "Comfortable and clean", "Stunning views",
  "Perfect for a long weekend", "Charming and quiet", "Excellent value",
];
const REVIEW_BODIES = [
  "The staff went out of their way to make our trip special. Rooms were spotless and the breakfast was a highlight.",
  "Beautiful property, walkable to everything we wanted to see. We'd happily return.",
  "Quiet, comfortable, and beautifully designed. The bed was incredibly comfortable.",
  "A little slice of calm. The pool area was never crowded and the spa was worth every penny.",
  "Location can't be beaten. We rolled out of bed and straight into the old town.",
  "Great value for the quality. Minor wait at check-in but otherwise flawless.",
];

function hotelName(seed: number): string {
  const r = mulberry32(seed);
  const usePrefix = r() > 0.35;
  const prefix = usePrefix ? pick(HOTEL_PREFIXES) + " " : "";
  return `${prefix}${pick(HOTEL_CORES)} ${pick(HOTEL_SUFFIXES)}`;
}

function reference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(rand() * chars.length)];
  return `WL-${s}`;
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clean slate (respect FK order).
  await db.payment.deleteMany();
  await db.booking.deleteMany();
  await db.review.deleteMany();
  await db.roomType.deleteMany();
  await db.hotel.deleteMany();
  await db.suggestion.deleteMany();
  await db.destination.deleteMany();

  // --- Demo users -----------------------------------------------------------
  const demoPassword = await hash("password123", 10);
  await db.user.upsert({
    where: { email: "demo@wanderlust.test" },
    update: {},
    create: {
      email: "demo@wanderlust.test",
      name: "Demo Traveler",
      passwordHash: demoPassword,
      role: "USER",
    },
  });
  await db.user.upsert({
    where: { email: "admin@wanderlust.test" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@wanderlust.test",
      name: "Admin",
      passwordHash: demoPassword,
      role: "ADMIN",
    },
  });
  console.log("  ✓ demo + admin users (password: password123)");

  let hotelCount = 0;
  let roomCount = 0;

  for (const [di, d] of destinations.entries()) {
    const destination = await db.destination.create({
      data: {
        slug: d.slug,
        name: d.name,
        country: d.country,
        region: d.region,
        description: d.description,
        heroImage: img(`${d.slug}-hero`),
        latitude: d.latitude,
        longitude: d.longitude,
        vibes: d.vibes as SeedVibe[],
        bestSeason: d.bestSeason,
        avgDailyBudgetCents: d.avgDailyBudgetCents,
      },
    });

    const numHotels = intBetween(4, 6);
    for (let h = 0; h < numHotels; h++) {
      const star = intBetween(3, 5);
      // Nightly base scales with destination budget and star rating.
      const base = Math.round(
        (d.avgDailyBudgetCents * (0.7 + star * 0.28) * between(0.85, 1.25)) / 100,
      ) * 100;
      const guestRating = Number(between(7.4, 9.6).toFixed(1));
      const name = hotelName(di * 100 + h * 7 + 1);
      const slug = `${d.slug}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${h}`;
      const numAmenities = intBetween(7, 12);

      const hotel = await db.hotel.create({
        data: {
          slug,
          destinationId: destination.id,
          name,
          description: `A ${star}-star stay in the heart of ${d.name}. ${d.description.split(". ")[0]}. Thoughtful service, a memorable setting, and easy access to the best of ${d.country}.`,
          address: `${intBetween(1, 220)} ${pick(["Harbour", "Old Town", "Marina", "Garden", "Hillside", "Cathedral"])} ${pick(["Road", "Street", "Lane", "Avenue", "Promenade"])}, ${d.name}`,
          starRating: star,
          guestRating,
          reviewCount: intBetween(80, 1900),
          images: [
            img(`${slug}-1`), img(`${slug}-2`), img(`${slug}-3`),
            img(`${slug}-4`), img(`${slug}-5`),
          ],
          amenities: sample(AMENITIES, numAmenities),
          latitude: d.latitude + between(-0.04, 0.04),
          longitude: d.longitude + between(-0.04, 0.04),
          freeCancellation: rand() > 0.25,
          basePriceCents: base,
        },
      });
      hotelCount++;

      // Room types
      const numRooms = intBetween(3, 5);
      const templates = sample(ROOM_TEMPLATES, numRooms);
      let minRoomPrice = Infinity;
      for (const [ri, t] of templates.entries()) {
        const price = Math.round((base * t.mult) / 100) * 100;
        minRoomPrice = Math.min(minRoomPrice, price);
        await db.roomType.create({
          data: {
            hotelId: hotel.id,
            name: t.name,
            description: `${t.sizeSqm} m² · ${t.bedConfig}. Sleeps up to ${t.maxOccupancy}.`,
            maxOccupancy: t.maxOccupancy,
            bedConfig: t.bedConfig,
            sizeSqm: t.sizeSqm,
            pricePerNightCents: price,
            totalRooms: intBetween(4, 14),
            amenities: sample(ROOM_AMENITIES, intBetween(4, 7)),
            images: [img(`${slug}-room-${ri}-1`), img(`${slug}-room-${ri}-2`)],
            refundable: hotel.freeCancellation && ri % 2 === 0,
          },
        });
        roomCount++;
      }
      // Sync denormalized base price to cheapest room.
      if (minRoomPrice < base) {
        await db.hotel.update({
          where: { id: hotel.id },
          data: { basePriceCents: minRoomPrice },
        });
      }

      // Reviews
      const numReviews = intBetween(3, 6);
      for (let rv = 0; rv < numReviews; rv++) {
        await db.review.create({
          data: {
            hotelId: hotel.id,
            author: pick(REVIEW_AUTHORS),
            rating: Number(
              Math.min(10, Math.max(6, guestRating + between(-1.2, 0.8))).toFixed(1),
            ),
            title: pick(REVIEW_TITLES),
            body: pick(REVIEW_BODIES),
            stayDate: new Date(
              Date.now() - intBetween(20, 400) * 24 * 60 * 60 * 1000,
            ),
          },
        });
      }
    }
  }

  console.log(`  ✓ ${destinations.length} destinations`);
  console.log(`  ✓ ${hotelCount} hotels`);
  console.log(`  ✓ ${roomCount} room types`);
  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

// reference() is exported for reuse/testing of the booking code path.
export { reference };
