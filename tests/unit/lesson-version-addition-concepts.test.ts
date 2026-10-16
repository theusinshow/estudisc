import { expect, it } from "vitest";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { resolveLessonVersionContext } from "@/features/import/application/lesson-version-policy";
import { lessonVersionPackSchema } from "@/features/import/application/lesson-version-contracts";
import { lessonVersionFixture } from "../fixtures/lesson-version-import";

function enrich(unbound: boolean) {
  const { context, base, packet } = lessonVersionFixture();
  const source = context.track.modules.flatMap(module => module.lessons).find(entry => entry.id === base.id)!;
  if (unbound) { for (const block of source.blocks) block.conceptIds = []; packet.target.baseHash = hashCanonicalJson(source); }
  const lesson = structuredClone({ ...source, version: source.version + 1, status: "draft" as const });
  lesson.blocks.push({ id: `${base.id}-ADDED`, type: "note", schemaVersion: 1, conceptIds: [], payload: { title: "Erro comum", content: "Texto novo para o aluno." } } as never);
  return () => resolveLessonVersionContext([context], lessonVersionPackSchema.parse({ ...packet, packId: "estudisc.enrichment.concepts", lesson }));
}

it("requires Concepts on an added block when the published lesson binds blocks to Concepts", () => {
  expect(enrich(false)).toThrow("New blocks must use existing source Concepts");
});

it("accepts an added block without Concepts when no published block is bound to Concepts", () => {
  expect(enrich(true)).not.toThrow();
});
