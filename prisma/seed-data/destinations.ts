// Curated, believable destination seed data.
// Vibe values mirror the Prisma `Vibe` enum.

export type SeedVibe = "BEACH" | "CITY" | "CULTURE" | "ADVENTURE" | "RELAX";

export interface SeedDestination {
  slug: string;
  name: string;
  country: string;
  region: string;
  description: string;
  latitude: number;
  longitude: number;
  vibes: SeedVibe[];
  bestSeason: string;
  avgDailyBudgetCents: number;
}

export const destinations: SeedDestination[] = [
  {
    slug: "santorini",
    name: "Santorini",
    country: "Greece",
    region: "Cyclades",
    description:
      "Whitewashed villages tumbling toward a sapphire caldera, sunsets that stop conversation, and volcanic-sand beaches. Santorini pairs postcard romance with surprisingly good wine country.",
    latitude: 36.3932,
    longitude: 25.4615,
    vibes: ["BEACH", "RELAX", "CULTURE"],
    bestSeason: "Late April to early June, or September for warm seas without the peak crowds.",
    avgDailyBudgetCents: 18000,
  },
  {
    slug: "kyoto",
    name: "Kyoto",
    country: "Japan",
    region: "Kansai",
    description:
      "A thousand years of capital city distilled into temple gardens, geisha districts, and bamboo groves. Kyoto rewards slow mornings, tea, and wandering between shrines.",
    latitude: 35.0116,
    longitude: 135.7681,
    vibes: ["CULTURE", "CITY", "RELAX"],
    bestSeason: "Late March to April for cherry blossoms, November for autumn maples.",
    avgDailyBudgetCents: 16000,
  },
  {
    slug: "barcelona",
    name: "Barcelona",
    country: "Spain",
    region: "Catalonia",
    description:
      "Gaudí's dreamlike architecture, late-night tapas, and a city beach within walking distance of the Gothic Quarter. Equal parts art museum and party.",
    latitude: 41.3874,
    longitude: 2.1686,
    vibes: ["CITY", "CULTURE", "BEACH"],
    bestSeason: "May to June and September to October for warm, walkable weather.",
    avgDailyBudgetCents: 15000,
  },
  {
    slug: "queenstown",
    name: "Queenstown",
    country: "New Zealand",
    region: "Otago",
    description:
      "The adventure capital of the world, ringed by the Remarkables and Lake Wakatipu. Bungy, hike, ski, or just drink in the alpine views.",
    latitude: -45.0312,
    longitude: 168.6626,
    vibes: ["ADVENTURE", "RELAX"],
    bestSeason: "December to February for hiking, June to August for skiing.",
    avgDailyBudgetCents: 17000,
  },
  {
    slug: "marrakech",
    name: "Marrakech",
    country: "Morocco",
    region: "Marrakesh-Safi",
    description:
      "A sensory rush of souks, riads, and spice-scented squares. Retreat to a courtyard pool, then dive back into the medina's maze.",
    latitude: 31.6295,
    longitude: -7.9811,
    vibes: ["CULTURE", "CITY", "RELAX"],
    bestSeason: "March to May and October to November for mild days.",
    avgDailyBudgetCents: 11000,
  },
  {
    slug: "tulum",
    name: "Tulum",
    country: "Mexico",
    region: "Quintana Roo",
    description:
      "Clifftop Mayan ruins above a Caribbean beach, cenotes hidden in the jungle, and a beach-club scene that runs from yoga to midnight.",
    latitude: 20.2114,
    longitude: -87.4654,
    vibes: ["BEACH", "RELAX", "ADVENTURE"],
    bestSeason: "November to April for dry, sunny days.",
    avgDailyBudgetCents: 14000,
  },
  {
    slug: "reykjavik",
    name: "Reykjavik",
    country: "Iceland",
    region: "Capital Region",
    description:
      "A pocket-sized capital and the gateway to waterfalls, glaciers, and the northern lights. Soak in geothermal lagoons between road trips.",
    latitude: 64.1466,
    longitude: -21.9426,
    vibes: ["ADVENTURE", "CITY", "RELAX"],
    bestSeason: "June to August for the midnight sun, September to March for auroras.",
    avgDailyBudgetCents: 20000,
  },
  {
    slug: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    region: "Lisboa",
    description:
      "Pastel hills, rattling trams, and fado drifting from tiled doorways. A sunny, affordable European capital with the Atlantic at its back.",
    latitude: 38.7223,
    longitude: -9.1393,
    vibes: ["CITY", "CULTURE", "BEACH"],
    bestSeason: "March to June and September to October.",
    avgDailyBudgetCents: 13000,
  },
  {
    slug: "bali-ubud",
    name: "Ubud, Bali",
    country: "Indonesia",
    region: "Bali",
    description:
      "Rice terraces, temple ceremonies, and jungle spa retreats. Ubud is Bali's cultural heart and its calmest corner.",
    latitude: -8.5069,
    longitude: 115.2625,
    vibes: ["RELAX", "CULTURE", "ADVENTURE"],
    bestSeason: "April to October, the dry season.",
    avgDailyBudgetCents: 9000,
  },
  {
    slug: "cape-town",
    name: "Cape Town",
    country: "South Africa",
    region: "Western Cape",
    description:
      "Table Mountain over two oceans, penguin beaches, and winelands an hour away. A dramatic city where the wild is never far.",
    latitude: -33.9249,
    longitude: 18.4241,
    vibes: ["ADVENTURE", "BEACH", "CITY"],
    bestSeason: "November to March for warm, dry summer.",
    avgDailyBudgetCents: 12000,
  },
  {
    slug: "amalfi-coast",
    name: "Amalfi Coast",
    country: "Italy",
    region: "Campania",
    description:
      "Lemon groves and cliffside villages strung above the Tyrrhenian Sea. Boat between Positano and Ravello, then linger over long seafood lunches.",
    latitude: 40.634,
    longitude: 14.6027,
    vibes: ["BEACH", "RELAX", "CULTURE"],
    bestSeason: "May to June and September for sunshine without August crowds.",
    avgDailyBudgetCents: 19000,
  },
  {
    slug: "banff",
    name: "Banff",
    country: "Canada",
    region: "Alberta",
    description:
      "Turquoise lakes, glacier peaks, and grizzly country inside Canada's oldest national park. Hike, paddle, or ride the gondola to the views.",
    latitude: 51.1784,
    longitude: -115.5708,
    vibes: ["ADVENTURE", "RELAX"],
    bestSeason: "June to August for hiking, December to March for snow.",
    avgDailyBudgetCents: 16000,
  },
];
