import { mkdirSync, writeFileSync } from "node:fs";
import { reviewedGhRelease } from "./reviewed-release";
const { pack, batches } = reviewedGhRelease();
const output = ".local/gh-application";
mkdirSync(output, { recursive: true });
for (const [index, payload] of batches.entries()) writeFileSync(`${output}/publish-batch-${index + 1}.json`, `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(`${output}/application-plan.json`, `${JSON.stringify({ target: "https://vecta-three.vercel.app", pack: "packs/drafts/ifsc-2027-gh/gh.pack.json", packId: pack.packId, snapshot: pack.version, expectedLessons: 49, expectedQuestions: 392, publicationBatches: batches.map(b => b.lessons.length), humanPublicationAuthorized: true, importedToProduction: false, publishedToProduction: false, mediaPending: true }, null, 2)}\n`);
console.log(JSON.stringify({ prepared: true, lessons: 49, questions: 392, batches: batches.map(b => b.lessons.length), output }));
