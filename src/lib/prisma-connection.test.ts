import assert from "node:assert/strict";
import test from "node:test";
import {
  selectPrismaAccelerateUrl,
  selectPrismaConnectionString,
} from "./prisma-connection.ts";

const pooledUrl = "postgresql://runtime.example/postgres?pgbouncer=true";
const directUrl = "postgresql://direct.example/postgres";

test("local development prefers the direct database URL when available", () => {
  assert.equal(
    selectPrismaConnectionString({
      DATABASE_URL: pooledUrl,
      DIRECT_DATABASE_URL: directUrl,
      NODE_ENV: "development",
    }),
    directUrl,
  );
});

test("production runtime prefers the pooled database URL", () => {
  assert.equal(
    selectPrismaConnectionString({
      DATABASE_URL: pooledUrl,
      DIRECT_DATABASE_URL: directUrl,
      NODE_ENV: "production",
    }),
    pooledUrl,
  );
});

test("production build prefers the direct database URL", () => {
  assert.equal(
    selectPrismaConnectionString({
      DATABASE_URL: pooledUrl,
      DIRECT_DATABASE_URL: directUrl,
      NEXT_PHASE: "phase-production-build",
      NODE_ENV: "production",
    }),
    directUrl,
  );
});

test("Prisma Accelerate is used only when no postgres connection string is selected", () => {
  assert.equal(
    selectPrismaAccelerateUrl({
      DATABASE_URL: "prisma+postgres://accelerate.example",
      NODE_ENV: "production",
    }),
    "prisma+postgres://accelerate.example",
  );
  assert.equal(
    selectPrismaAccelerateUrl({
      DATABASE_URL: "prisma+postgres://accelerate.example",
      DIRECT_DATABASE_URL: directUrl,
      NODE_ENV: "development",
    }),
    undefined,
  );
});
