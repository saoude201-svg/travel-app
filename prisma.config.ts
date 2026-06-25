import path from "node:path";
import { defineConfig } from "prisma/config";

// With a config file present, Prisma 7 no longer auto-loads `.env`.
try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // .env is optional (e.g. CI/Vercel inject env directly).
}

// Prisma 7 moved the connection URL out of schema.prisma. Migration and
// introspection commands read it from here; the runtime client uses the
// driver adapter configured in src/lib/db.ts.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
});
