import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  selectPrismaAccelerateUrl,
  selectPrismaConnectionString,
} from "@/lib/prisma-connection";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const log: Prisma.LogLevel[] =
  process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

const runtimeConnectionString = selectPrismaConnectionString(process.env);
const adapter = runtimeConnectionString
  ? new PrismaPg({ connectionString: runtimeConnectionString })
  : undefined;
const accelerateUrl = selectPrismaAccelerateUrl(process.env);

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
