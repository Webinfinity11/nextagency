import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";
// Prisma 7 no longer reads .env itself; Railway passes real env vars, so the file is optional.
if (existsSync(".env")) process.loadEnvFile(".env");
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.mts" },
  datasource: { url: process.env.DATABASE_URL },
});
