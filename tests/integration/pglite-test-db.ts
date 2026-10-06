import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

import * as schema from "@/db/schema";

export async function createMigratedPgliteTestDatabase() {
  const client = new PGlite();
  const migrationsDirectory = path.join(process.cwd(), "src", "db", "migrations");
  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  // One transactional DDL batch avoids a WASM/SQL round trip for every statement.
  // Each database remains disposable and isolated; no seeded content or learner state is shared.
  const statements = await Promise.all(migrationFiles.map(async file => (await readFile(path.join(migrationsDirectory, file), "utf8")).split("--> statement-breakpoint").filter(statement => statement.trim()).join("\n")));
  await client.exec(`BEGIN;\n${statements.join("\n")}\nCOMMIT;`);

  const db = drizzle(client, { schema });

  return {
    db,
    async close() {
      await client.close();
    }
  };
}
