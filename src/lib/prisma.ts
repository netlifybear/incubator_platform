import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const log: Prisma.LogLevel[] =
  process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

const isNextBuild = process.env.NEXT_PHASE === "phase-production-build";
const preferredPostgresUrl = isNextBuild
  ? process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL
  : process.env.DATABASE_URL ?? process.env.DIRECT_DATABASE_URL;
const runtimeConnectionString = preferredPostgresUrl?.startsWith("postgres")
  ? preferredPostgresUrl
  : process.env.DIRECT_DATABASE_URL?.startsWith("postgres")
    ? process.env.DIRECT_DATABASE_URL
    : undefined;
const adapter = runtimeConnectionString
  ? new PrismaPg({ connectionString: runtimeConnectionString })
  : undefined;
const accelerateUrl = !adapter && process.env.DATABASE_URL?.startsWith("prisma")
  ? process.env.DATABASE_URL
  : undefined;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log,
    ...(adapter ? { adapter } : {}),
    ...(accelerateUrl ? { accelerateUrl } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
