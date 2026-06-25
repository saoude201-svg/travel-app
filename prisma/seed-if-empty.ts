import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedDatabase } from "./seed-core";

// Runs during the Vercel build (after `prisma migrate deploy`). Seeds demo
// data ONLY when the database is empty, and NEVER fails the build — seeding is
// non-critical, so any problem is logged and the deploy continues.
async function main() {
  try {
    process.loadEnvFile(path.join(process.cwd(), ".env"));
  } catch {
    /* env injected by the platform */
  }

  if (!process.env.DATABASE_URL) {
    console.log("[seed-if-empty] No DATABASE_URL at build time — skipping.");
    return;
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });
  try {
    const count = await db.destination.count();
    if (count > 0) {
      console.log(`[seed-if-empty] Database already has ${count} destinations — skipping.`);
      return;
    }
    console.log("[seed-if-empty] Empty database detected — loading demo data...");
    await seedDatabase(db, (msg) => console.log(msg));
  } finally {
    await db.$disconnect().catch(() => {});
  }
}

main()
  .catch((e) => {
    // Do not break the deploy if seeding fails.
    console.error("[seed-if-empty] Skipped due to error:", e?.message ?? e);
  })
  .finally(() => process.exit(0));
