// ADR 0063 interaction release. Preview by default (read-only checks, nothing written); `--publish` imports each next
// lesson version and activates it through Admin Direct with the given ADMIN owner and a truthful reason.
// Usage: pnpm exec tsx scripts/release-interactions.mts --uri-file FILE --batch FILE --actor OWNER_ID [--publish]
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { releaseInteractions } from "../tools/estudisc-content-studio/interaction-release";

const { values } = parseArgs({ options: { "uri-file": { type: "string" }, batch: { type: "string" }, actor: { type: "string" }, publish: { type: "boolean", default: false } } });
if (!values["uri-file"] || !values.batch || !values.actor) throw new Error("--uri-file, --batch and --actor are required");
const client = postgres(readFileSync(values["uri-file"], "utf8").trim(), { max: 1, prepare: false });
try {
  const batch = JSON.parse(readFileSync(values.batch, "utf8"));
  const reason = `Admin Direct under the standing owner authorization (AGENTS.md, ADR 0048) after engineering validation: hand-written practice interactions batch ${batch.batchId}. No independent editorial review recorded.`;
  const results = await releaseInteractions(drizzle(client, { schema }) as never, { batch, actor: { ownerId: values.actor, role: "ADMIN" }, reason, publish: values.publish });
  for (const row of results) console.log(`${row.lessonId} v${row.from} -> v${row.to} ${row.status} ${row.questions.join(",")}`);
  if (!values.publish) console.log("Preview only: nothing written.");
} finally {
  await client.end();
}
