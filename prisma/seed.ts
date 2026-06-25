import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedDatabase } from "./seed-core";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  /* env may be injected by the environment */
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

seedDatabase(db, (msg) => console.log(msg))
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
