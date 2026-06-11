type PrismaConnectionEnv = {
  DATABASE_URL?: string;
  DIRECT_DATABASE_URL?: string;
  NEXT_PHASE?: string;
  NODE_ENV?: string;
};

function postgresUrl(url: string | undefined) {
  return url?.startsWith("postgres") ? url : undefined;
}

export function selectPrismaConnectionString(env: PrismaConnectionEnv) {
  const directUrl = postgresUrl(env.DIRECT_DATABASE_URL);
  const runtimeUrl = postgresUrl(env.DATABASE_URL);

  if (env.NEXT_PHASE === "phase-production-build") {
    return directUrl ?? runtimeUrl;
  }

  if (env.NODE_ENV === "development") {
    return directUrl ?? runtimeUrl;
  }

  return runtimeUrl ?? directUrl;
}

export function selectPrismaAccelerateUrl(env: PrismaConnectionEnv) {
  const connectionString = selectPrismaConnectionString(env);

  if (connectionString) {
    return undefined;
  }

  return env.DATABASE_URL?.startsWith("prisma") ? env.DATABASE_URL : undefined;
}
