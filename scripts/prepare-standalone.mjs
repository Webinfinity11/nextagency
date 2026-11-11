import { cpSync, mkdirSync } from "node:fs";
// Next's standalone server does not copy public/static assets automatically.
mkdirSync(".next/standalone/.next", { recursive: true });
cpSync("public", ".next/standalone/public", { recursive: true });
cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
