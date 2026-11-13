import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
// One client per process; dev hot reloads would otherwise open a new pool on every edit.
// The cached dev client is replaced when the schema changes (after `prisma generate`), or it would reject new fields.
const shape = Object.keys(Prisma.ProjectScalarFieldEnum).join();
const g = globalThis as unknown as { prisma?: PrismaClient; prismaShape?: string };
if (g.prisma && g.prismaShape !== shape) { void g.prisma.$disconnect(); g.prisma = undefined; }
export const db = g.prisma ?? new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
if (process.env.NODE_ENV !== "production") { g.prisma = db; g.prismaShape = shape; }
