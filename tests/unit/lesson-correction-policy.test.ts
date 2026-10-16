// @vitest-environment node
import { describe, expect, it } from "vitest";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { lessonVersionPackSchema, type LessonVersionPack } from "@/features/import/application/lesson-version-contracts";
import { resolveLessonVersionContext } from "@/features/import/application/lesson-version-policy";
import { lessonVersionFixture } from "../fixtures/lesson-version-import";

/** A correction version on top of the published base: edit or remove listed blocks, keep everything else. */
function correction(edit: (lesson: LessonVersionPack["lesson"], base: LessonVersionPack["lesson"]) => LessonVersionPack["corrections"]) {
  const { context, base, packet } = lessonVersionFixture();
  const lesson = structuredClone({ ...base, version: base.version + 1, status: "draft" as const });
  const corrections = edit(lesson, base);
  const pack = lessonVersionPackSchema.parse({ ...packet, packId: "estudisc.correction.fixture", lesson, corrections });
  return { context, base, pack };
}
const textBlock = (lesson: LessonVersionPack["lesson"]) => lesson.blocks.find(block => typeof block.payload.content === "string" && ["note", "text", "summary", "worked-example", "example", "warning"].includes(block.type))!;

describe("lesson correction versions", () => {
  it("replaces a listed block bound to its published hash and keeps every other block", () => {
    const { context, pack, base } = correction((lesson, original) => {
      const block = textBlock(lesson); const old = original.blocks.find(entry => entry.id === block.id)!;
      block.payload = { ...block.payload, content: `${String(block.payload.content)} Corrigido.` };
      return { reason: "Remove internal editorial text visible to students", blocks: [{ blockId: block.id, action: "replace", baseBlockHash: hashCanonicalJson(old) }] };
    });
    const { projection } = resolveLessonVersionContext([context], pack);
    const lesson = projection.track.modules.flatMap(entry => entry.lessons).find(entry => entry.id === base.id)!;
    expect(lesson.version).toBe(base.version + 1);
    expect(lesson.blocks.map(block => block.id)).toEqual(base.blocks.map(block => block.id));
  });

  it("removes a listed placeholder block", () => {
    const { context, pack, base } = correction((lesson, original) => {
      const block = textBlock(lesson); lesson.blocks = lesson.blocks.filter(entry => entry.id !== block.id);
      return { reason: "Omit a placeholder block with no student value", blocks: [{ blockId: block.id, action: "remove", baseBlockHash: hashCanonicalJson(original.blocks.find(entry => entry.id === block.id)) }] };
    });
    const { projection } = resolveLessonVersionContext([context], pack);
    expect(projection.track.modules.flatMap(entry => entry.lessons).find(entry => entry.id === base.id)!.blocks).toHaveLength(base.blocks.length - 1);
  });

  it("rejects a change to a block that is not listed", () => {
    const { context, pack } = correction((lesson, original) => {
      const [listed, unlisted] = lesson.blocks.filter(block => typeof block.payload.content === "string" && ["note", "text", "summary", "worked-example"].includes(block.type));
      listed.payload = { ...listed.payload, content: "Texto novo." };
      unlisted.payload = { ...unlisted.payload, content: "Mudança escondida." };
      return { reason: "Only one block is declared here", blocks: [{ blockId: listed.id, action: "replace", baseBlockHash: hashCanonicalJson(original.blocks.find(entry => entry.id === listed.id)) }] };
    });
    expect(() => resolveLessonVersionContext([context], pack)).toThrow(/Retained blocks/);
  });

  it("rejects a stale base block hash, a type change and a no-op replacement", () => {
    const stale = correction(lesson => {
      const block = textBlock(lesson); block.payload = { ...block.payload, content: "Novo." };
      return { reason: "Stale hash must be refused", blocks: [{ blockId: block.id, action: "replace", baseBlockHash: "0".repeat(64) }] };
    });
    expect(() => resolveLessonVersionContext([stale.context], stale.pack)).toThrow(/Correction target block changed/);
    const retyped = correction((lesson, original) => {
      const block = textBlock(lesson); const old = original.blocks.find(entry => entry.id === block.id)!;
      Object.assign(block, { type: block.type === "warning" ? "note" : "warning" }); block.payload = { ...block.payload, type: block.type };
      return { reason: "Type changes are not corrections", blocks: [{ blockId: block.id, action: "replace", baseBlockHash: hashCanonicalJson(old) }] };
    });
    expect(() => resolveLessonVersionContext([retyped.context], retyped.pack)).toThrow(/keep its block type/);
    const noop = correction((lesson, original) => {
      const block = textBlock(lesson);
      return { reason: "Nothing actually changes here", blocks: [{ blockId: block.id, action: "replace", baseBlockHash: hashCanonicalJson(original.blocks.find(entry => entry.id === block.id)) }] };
    });
    expect(() => resolveLessonVersionContext([noop.context], noop.pack)).toThrow(/does not change/);
  });

  it("corrects figure text but never swaps the image", () => {
    const { context, base, packet } = lessonVersionFixture();
    const contextWithFigure = structuredClone(context);
    const published = contextWithFigure.track.modules[0].lessons.find(entry => entry.id === base.id)!;
    const figure = { id: "FIG-1", schemaVersion: 1, type: "figure", conceptIds: [], payload: { type: "figure", src: "data:image/png;base64,iVBORw0KGgo=", alt: "Circuito simples", caption: "Versão estática em rascunho", width: 10, height: 10 } };
    published.blocks.push(figure as never);
    const make = (payload: Record<string, unknown>) => {
      const lesson = structuredClone({ ...published, version: published.version + 1, status: "draft" as const });
      const target = lesson.blocks.find(entry => entry.id === "FIG-1")!; target.payload = { ...target.payload, ...payload };
      return lessonVersionPackSchema.parse({ ...packet, target: { ...packet.target, baseHash: hashCanonicalJson(published) }, lesson,
        corrections: { reason: "Remove the internal figure briefing", blocks: [{ blockId: "FIG-1", action: "replace", baseBlockHash: hashCanonicalJson(figure) }] } });
    };
    expect(() => resolveLessonVersionContext([contextWithFigure], make({ caption: "Circuito com chave fechada." }))).not.toThrow();
    expect(() => resolveLessonVersionContext([contextWithFigure], make({ src: "data:image/png;base64,AAAA" }))).toThrow(/keep its image/);
  });

  it("keeps the append-only rule when no correction is declared", () => {
    const { context, base, packet } = lessonVersionFixture();
    const unchanged = lessonVersionPackSchema.parse({ ...packet, lesson: { ...structuredClone(base), version: base.version + 1, status: "draft" } });
    expect(() => resolveLessonVersionContext([context], unchanged)).toThrow(/Enrichment must add at least one block/);
    expect(resolveLessonVersionContext([context], packet).base.id).toBe(base.id);
  });
});
