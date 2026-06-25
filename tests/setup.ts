import path from "node:path";

// Load local .env so DB-backed tests can reach Postgres. In CI, env is
// injected directly and this is a no-op.
try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  /* no .env present */
}
