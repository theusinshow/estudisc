import { eq } from "drizzle-orm";
import { lessons,questionVersions } from "@/db/schema";
import type { createMigratedPgliteTestDatabase } from "./pglite-test-db";
// Simulates editorial release only in a disposable database. Never used by application code.
export async function simulatePublication(db:Awaited<ReturnType<typeof createMigratedPgliteTestDatabase>>["db"]){
  await db.update(questionVersions).set({status:"published"});
  const rows=await db.select().from(lessons);
  for(const row of rows){const metadata=row.metadata as Record<string,unknown>;if(metadata.kind&&row.stableId==="MAT-07")await db.update(lessons).set({metadata:{...metadata,status:"published",qaReleaseId:crypto.randomUUID()}}).where(eq(lessons.id,row.id));}
}
