import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";
import { getServerEnv } from "@/lib/env";

let postgresClient: postgres.Sql | undefined;

export function getDatabaseUrl() {
  const url=getServerEnv().DATABASE_URL;
  if(process.env.NODE_ENV==="production"&&url==="memory://local")throw new Error("memory://local is a development-only harness");
  return url;
}

export function getDatabase() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (databaseUrl === "memory://local") {
    throw new Error("memory://local does not expose a Drizzle database");
  }

  postgresClient ??= postgres(databaseUrl, {
    max: 1,
    prepare: false
  });

  return drizzle(postgresClient, { schema });
}

export async function ensureDatabaseReady() {
  return;
}

export async function closeDatabaseConnection() {
  if (postgresClient) {
    await postgresClient.end({ timeout: 1 });
    postgresClient = undefined;
  }

}
