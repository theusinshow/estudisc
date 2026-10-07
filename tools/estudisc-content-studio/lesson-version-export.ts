import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { lessonVersionPackSchema } from "@/features/import/application/lesson-version-contracts";
import { Studio, atomicJson } from "./workspace";
import { prepareEnrichmentPreview } from "./enrichment";
import { loadBlueprintCorpus } from "./blueprint-sources";

export function exportLessonVersion(studio: Studio, recipe: unknown) {
  const candidate = prepareEnrichmentPreview(studio, recipe), identity = candidate.preview.recipe.identity;
  const source = loadBlueprintCorpus(studio.root).find(s => s.pack.track.id === identity.trackId && s.pack.version === identity.trackVersion)!;
  const moduleRecord = source.pack.track.modules.find(m => m.lessons.some(l => l.id === identity.lessonId && l.version === identity.lessonVersion))!;
  const packet = lessonVersionPackSchema.parse({ schema: "caderno.lesson.v2", packId: `estudisc.lesson-version.${hashCanonicalJson(identity).slice(0,24)}.v${candidate.preview.lesson.version}`, version: 1,
    authorId: candidate.preview.recipe.authorId, target: { trackId: identity.trackId, trackVersion: identity.trackVersion, moduleId: moduleRecord.id, lessonId: identity.lessonId, baseVersion: identity.lessonVersion, baseHash: candidate.preview.sourceLessonHash },
    lesson: candidate.preview.lesson, questionReferences: candidate.preview.questionReferences });
  const file = join(candidate.directory, "lesson-version.pack.json"), content = JSON.stringify(packet, null, 2) + "\n";
  const written = !existsSync(file) || readFileSync(file, "utf8") !== content;
  if (written) atomicJson(file, packet);
  return { file, packet, written, contentHash: hashCanonicalJson(packet), publicationRequest: candidate.reviewRequest.publicationRequest };
}
