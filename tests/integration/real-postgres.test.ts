import examplePack from "../../packs/examples/javascript-fundamentals.track.json";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PgTable } from "drizzle-orm/pg-core";
import postgres from "postgres";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActivityAttemptRepository } from "@/db/repositories/activity-attempt-repository";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { ProgressRepository } from "@/db/repositories/progress-repository";
import { activities, attempts, packImports, studyEvents, tracks } from "@/db/schema";
import type * as schema from "@/db/schema";
import { runCodeActivity, submitCodeActivity } from "@/features/activities/api";
import { importTrackPack } from "@/features/import/api";
import { getServerEnv } from "@/lib/env";

const shouldRunRealPostgres = getServerEnv().ESTUDISC_RUN_REAL_POSTGRES_TESTS === "1";
const passingSource =
  "const documentExists = true;\nconst userAuthorized = false;\nconst canOpen = documentExists && userAuthorized;\nconsole.log(canOpen);";

describe.skipIf(!shouldRunRealPostgres)("real PostgreSQL migration-backed smoke", () => {
  let sqlClient: postgres.Sql | undefined;
  let disposableSchemaName: string | undefined;

  afterEach(async () => {
    vi.unstubAllEnvs();

    if (sqlClient && disposableSchemaName) {
      await sqlClient.unsafe(`drop schema if exists ${escapeIdentifier(disposableSchemaName)} cascade`);
    }

    await sqlClient?.end({ timeout: 1 });
    sqlClient = undefined;
    disposableSchemaName = undefined;
  });

  it("applies checked-in migrations and preserves RUN/SUBMIT behavior on a disposable schema", async () => {
    const databaseUrl = await resolveRealPostgresUrl();

    sqlClient = postgres(databaseUrl, {
      max: 1,
      onnotice: () => undefined,
      prepare: false
    });
    disposableSchemaName = createDisposableSchemaName();

    await sqlClient.unsafe(`create schema ${escapeIdentifier(disposableSchemaName)}`);
    await sqlClient.unsafe(`set search_path to ${escapeIdentifier(disposableSchemaName)}, public`);
    await applyMigrations(sqlClient, disposableSchemaName);

    const db = drizzle(sqlClient, { schema: await import("@/db/schema") });
    const importRepository = new DrizzleTrackImportRepository(db as never);
    const attemptRepository = new ActivityAttemptRepository(db as never);
    const progressRepository = new ProgressRepository(db as never);

    vi.stubEnv("ESTUDISC_OWNER_ID", `real-postgres-owner-${randomUUID()}`);

    const importResult = await importTrackPack(examplePack, importRepository);
    expect(importResult).toMatchObject({
      status: "imported",
      summary: {
        trackStableId: "javascript",
        importedLessons: 1,
        importedActivities: 2
      }
    });

    await expect(countRows(db, packImports)).resolves.toBe(1);
    await expect(countRows(db, tracks)).resolves.toBe(1);
    await expect(countRows(db, activities)).resolves.toBe(2);
    await expect(countRows(db, attempts)).resolves.toBe(0);
    await expect(countRows(db, studyEvents)).resolves.toBe(0);

    const runResult = await runCodeActivity("js-logical-and-code-001", passingSource, attemptRepository);
    expect(runResult).toMatchObject({
      status: "executed",
      attemptsBefore: 0,
      execution: {
        status: "completed",
        stdout: ["false"]
      }
    });
    await expect(countRows(db, attempts)).resolves.toBe(0);
    await expect(countRows(db, studyEvents)).resolves.toBe(0);

    const submitResult = await submitCodeActivity("js-logical-and-code-001", passingSource, attemptRepository);
    expect(submitResult).toMatchObject({
      status: "submitted",
      evaluation: {
        outcome: "passed"
      },
      submission: {
        attemptNumber: 1,
        eventType: "activity_submitted"
      }
    });

    await expect(countRows(db, attempts)).resolves.toBe(1);
    await expect(countRows(db, studyEvents)).resolves.toBe(1);
    await expect(progressRepository.getLessonProgress(process.env.ESTUDISC_OWNER_ID ?? "", "js-fundamentals-001")).resolves.toMatchObject({
      totalActivities: 2,
      attemptedActivities: 1,
      passedActivities: 1
    });
    await expect(progressRepository.getTrackProgress(process.env.ESTUDISC_OWNER_ID ?? "", "javascript")).resolves.toMatchObject({
      totalLessons: 1,
      totalActivities: 2,
      attemptedActivities: 1,
      passedActivities: 1
    });

    console.info(
      [
        "real_postgres_validation:passed",
        `schema=${disposableSchemaName}`,
        "migrations=7",
        "tracks=1",
        "activities=2",
        "run_attempts=0",
        "submit_attempts=1"
      ].join(":")
    );
  });
});

async function resolveRealPostgresUrl() {
  await loadIgnoredLocalDatabaseEnv();

  const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Set TEST_DATABASE_URL or DATABASE_URL in the environment or ignored .env.local to run pnpm test:postgres.");
  }

  if (databaseUrl === "memory://local") {
    throw new Error("pnpm test:postgres requires a real PostgreSQL URL, not memory://local.");
  }

  if (!databaseUrl.startsWith("postgres://") && !databaseUrl.startsWith("postgresql://")) {
    throw new Error("pnpm test:postgres requires a postgres:// or postgresql:// URL.");
  }

  return databaseUrl;
}

async function loadIgnoredLocalDatabaseEnv() {
  if (process.env.TEST_DATABASE_URL || process.env.DATABASE_URL) {
    return;
  }

  try {
    const raw = await readFile(path.join(process.cwd(), ".env.local"), "utf8");

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const index = trimmed.indexOf("=");

      if (index <= 0) {
        continue;
      }

      const key = trimmed.slice(0, index).trim();

      if (key !== "TEST_DATABASE_URL" && key !== "DATABASE_URL") {
        continue;
      }

      process.env[key] = stripOptionalQuotes(trimmed.slice(index + 1).trim());
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

async function applyMigrations(sqlClient: postgres.Sql, schemaName: string) {
  const migrationsDirectory = path.join(process.cwd(), "src", "db", "migrations");
  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  for (const migrationFile of migrationFiles) {
    const migrationSql = await readFile(path.join(migrationsDirectory, migrationFile), "utf8");

    for (const statement of migrationSql.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();

      if (trimmed.length > 0) {
        await sqlClient.unsafe(bindMigrationStatementToSchema(trimmed, schemaName));
      }
    }
  }
}

async function countRows(db: ReturnType<typeof drizzle<typeof schema>>, table: PgTable) {
  const [row] = await db.select({ value: count() }).from(table);
  return row?.value ?? 0;
}

function createDisposableSchemaName() {
  return `estudisc_real_pg_${randomUUID().replaceAll("-", "_")}`;
}

function escapeIdentifier(identifier: string) {
  if (!/^estudisc_real_pg_[a-z0-9_]+$/.test(identifier)) {
    throw new Error(`Refusing unsafe PostgreSQL schema identifier: ${identifier}`);
  }

  return `"${identifier}"`;
}

function bindMigrationStatementToSchema(statement: string, schemaName: string) {
  return statement.replaceAll('"public".', `${escapeIdentifier(schemaName)}.`);
}

function stripOptionalQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
