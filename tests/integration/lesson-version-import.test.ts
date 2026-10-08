import { afterEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { activities, contentBlocks, contentPublicationEvents, contentQaReviews, lessonConcepts, lessons, modules, packImports, questionVersions, tracks } from "@/db/schema";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { MemoryTrackImportRepository, MemoryCatalogRepository } from "@/db/repositories/memory-store";
import { getMemoryStore } from "@/db/repositories/memory/store";
import { CatalogRepository } from "@/db/repositories/catalog-repository";
import { AuthoringContextRepository } from "@/db/repositories/authoring-context-repository";
import { buildAuthoringPacket } from "@/features/content-qa/authoring-contracts";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { importLessonVersion, resolveLessonVersionContext } from "@/features/import/application/lesson-version-policy";
import { validateTrackPack } from "@/features/import/api";
import { lessonVersionFixture } from "../fixtures/lesson-version-import";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

describe("targeted immutable lesson version", () => {
  let fixtureDb: Awaited<ReturnType<typeof createMigratedPgliteTestDatabase>> | undefined;
  afterEach(async () => { await fixtureDb?.close(); fixtureDb = undefined; });
  async function setup() {
    const data = lessonVersionFixture(); fixtureDb = await createMigratedPgliteTestDatabase();
    const db = fixtureDb.db, repo = new DrizzleTrackImportRepository(db as never, "fixture-admin");
    const valid = validateTrackPack(data.context); expect(valid.ok).toBe(true);
    await repo.applyTrackPack(data.context, hashCanonicalJson(data.context));
    const qa = new ContentQaRepository(db as never);
    await qa.publishLessonsDirect({ ownerId: "fixture-admin", role: "ADMIN" }, { lessons: [{ lessonId: data.base.id, version: data.base.version }], reason: "Disposable fixture: actual Admin Direct path, no editorial approvals fabricated." });
    return { ...data, db, repo, qa };
  }

  it("appends only one draft version, reuses Questions and publishes via the actual Admin Direct engine", async () => {
    const { db, repo, packet, base, qa } = await setup();
    const originals = { tracks: await db.select().from(tracks), modules: await db.select().from(modules), lessons: await db.select().from(lessons), questions: await db.select().from(questionVersions), blocks: await db.select().from(contentBlocks), activities: await db.select().from(activities) };
    expect((await importLessonVersion(packet, repo, true)).status).toBe("ready");
    expect((await db.select().from(packImports)).length).toBe(1);
    expect((await importLessonVersion(packet, repo)).status).toBe("imported");
    expect((await importLessonVersion(packet, repo)).status).toBe("already_imported");
    const catalog = new CatalogRepository(db as never);
    expect((await catalog.getLesson(base.id))?.blocks.length).toBe(base.blocks.length + 1);
    expect((await catalog.getLesson(base.id, undefined, undefined, true))?.blocks.length).toBe(base.blocks.length);
    expect(await catalog.getLesson(base.id, 5, undefined, true)).toBeNull();
    const trackView = await catalog.getTrack(packet.target.trackId);
    expect(trackView?.modules[0].lessons.find(l => l.stableId === base.id)?.activityCount).toBe(18);
    await qa.publishLessonsDirect({ ownerId: "fixture-admin", role: "ADMIN" }, { lessons: [{ lessonId: base.id, version: 5 }], reason: "Disposable community release fixture, using authenticated-role Admin Direct semantics." });
    expect((await catalog.getLesson(base.id, undefined, undefined, true))?.blocks.length).toBe(base.blocks.length + 1);
    expect((await catalog.getLesson(base.id, 4, undefined, true))?.blocks.length).toBe(base.blocks.length);
    const appended = (await db.select().from(lessons)).find(l => l.stableId === base.id && l.contentVersion === 5)!;
    const prior = originals.lessons.find(l => l.stableId === base.id)!;
    const clean = (rows: typeof originals.activities) => rows.map(({ stableId, type, prompt, config, evaluatorVersion, orderIndex }) => ({ stableId, type, prompt, config, evaluatorVersion, orderIndex })).sort((a,b) => a.orderIndex-b.orderIndex);
    expect(clean((await db.select().from(activities)).filter(a => a.lessonId === appended.id))).toEqual(clean(originals.activities.filter(a => a.lessonId === prior.id)));
    expect(await db.select().from(tracks)).toEqual(originals.tracks);
    expect(await db.select().from(modules)).toEqual(originals.modules);
    expect(await db.select().from(questionVersions)).toEqual(originals.questions);
    expect((await db.select().from(lessons)).filter(l => originals.lessons.some(o => o.id === l.id))).toEqual(originals.lessons);
    expect((await db.select().from(contentBlocks)).filter(l => originals.blocks.some(o => o.id === l.id))).toEqual(originals.blocks);
    expect((await db.select().from(activities)).filter(l => originals.activities.some(o => o.id === l.id))).toEqual(originals.activities);
    expect(await db.select().from(contentQaReviews)).toEqual([]);
    expect((await db.select().from(contentPublicationEvents)).every(e => e.mode === "admin_direct")).toBe(true);
    expect((await db.select().from(lessonConcepts)).length).toBeGreaterThan(0);
    const receipts = await db.select().from(packImports);
    const projected = receipts.find(r => r.schema === "caderno.lesson.v2")!.manifest;
    expect(validateTrackPack(projected).ok).toBe(false);
    await expect(importLessonVersion({ ...packet, packId: "other.receipt" }, repo)).rejects.toThrow("Source lesson");
  });

  it("reads actual SQL source publication per version and appends a source-bound text draft without rewriting Questions", async () => {
    const { db, repo, base } = await setup();
    const reader = new AuthoringContextRepository(db as never);
    const source = (await reader.get("fixture-admin", base.id, base.version))!;
    const binding = (await reader.getBinding("fixture-admin", base.id, base.version))!;
    expect(binding.subjectCode).toBe("MAT");
    expect(binding.blueprintSourceHash).toBe(hashCanonicalJson({identity:{trackId:source.target.trackId,trackVersion:source.target.trackVersion,lessonId:base.id,lessonVersion:base.version},subjectCode:"MAT",lesson:base}));
    expect(source.published).toBe(true);
    expect(source.target.baseHash).toBe(hashCanonicalJson(base));
    const originalQuestions = await db.select().from(questionVersions);
    const packet = buildAuthoringPacket(source, [{ id: "admin-note", type: "note", schemaVersion: 1, conceptIds: [base.concepts[0].id], payload: { type: "note", content: "Additional source-bound explanation." } }], "fixture.admin.text");
    expect((await importLessonVersion(packet, repo, true)).status).toBe("ready");
    expect((await importLessonVersion(packet, repo)).status).toBe("imported");
    expect((await reader.get("fixture-admin", base.id))?.published).toBe(false);
    expect((await reader.get("fixture-admin", base.id, base.version))?.published).toBe(true);
    expect((await reader.get("fixture-admin", base.id, base.version + 1))?.lesson.blocks.at(-1)?.id).toBe("admin-note");
    expect(await reader.get("fixture-admin", base.id, 999)).toBeNull();
    expect(await db.select().from(questionVersions)).toEqual(originalQuestions);
    expect((await new CatalogRepository(db as never).getLesson(base.id, undefined, undefined, true))?.resumeScope?.version).toBe(base.version);
  });

  it("fails closed on stale references and rolls back the receipt/lesson after a mid-write database failure", async () => {
    const { db, repo, packet, qa } = await setup();
    const forged = structuredClone(packet); forged.questionReferences[0].hash = "0".repeat(64);
    await expect(importLessonVersion(forged, repo)).rejects.toThrow("Question reference");
    const original = await db.select().from(lessons);
    await db.execute(sql`create function reject_enrichment_block() returns trigger language plpgsql as $$ begin if NEW.stable_id='BLK-MAT-07-ENR-PERCENT-01' then raise exception 'synthetic failure'; end if; return NEW; end $$`);
    await db.execute(sql`create trigger reject_enrichment before insert on content_blocks for each row execute function reject_enrichment_block()`);
    await expect(importLessonVersion(packet, repo)).rejects.toThrow();
    expect(await db.select().from(lessons)).toEqual(original);
    expect((await db.select().from(packImports)).length).toBe(1);
    await db.execute(sql`drop trigger reject_enrichment on content_blocks`);
    expect((await importLessonVersion(packet, repo)).status).toBe("imported");
    await expect(importLessonVersion({ ...packet, authorId: "different-author" }, repo)).rejects.toThrow("receipt");
    // Withdrawing one immutable Question's availability invalidates preview before any append.
    await qa.publishLessonsDirect({ ownerId: "fixture-admin", role: "ADMIN" }, { lessons: [{ lessonId: packet.lesson.id, version: 5 }], reason: "Disposable direct publication before availability-withdrawal regression check." });
    const next = structuredClone(packet); next.packId = "fixture.next-version"; next.target.baseVersion = 5; next.target.baseHash = hashCanonicalJson(packet.lesson); next.lesson.version = 6;
    next.lesson.blocks.push({ ...structuredClone(next.lesson.blocks.find(b => b.type === "numeric-explorer")!), id: "another-explorer" });
    await db.update(questionVersions).set({ status: "retired" }).where(eq(questionVersions.contentHash, packet.questionReferences[0].hash));
    await expect(importLessonVersion(next, repo, true)).rejects.toThrow("Question version unavailable");
    expect((await db.select().from(packImports)).length).toBe(2);
  });

  it("shares exact preservation/idempotence/preview policy with the disposable memory store", async () => {
    const { context, packet, base } = lessonVersionFixture(true), store = structuredClone(getMemoryStore());
    const repo = new MemoryTrackImportRepository(store); await repo.applyTrackPack(context, hashCanonicalJson(context));
    const before = hashCanonicalJson({ tracks: store.tracks, modules: store.modules, lessons: store.lessons, blocks: store.blocks, activities: store.activities });
    const results = await Promise.all([importLessonVersion(packet, repo), importLessonVersion(packet, repo)]);
    expect(results.map(r => r.status)).toEqual(["imported", "already_imported"]);
    expect(hashCanonicalJson({ tracks: store.tracks, modules: store.modules, lessons: store.lessons, blocks: store.blocks, activities: store.activities })).toBe(before);
    const catalog = new MemoryCatalogRepository(store);
    expect((await catalog.getLesson(base.id))?.blocks.length).toBe(base.blocks.length + 1);
    expect((await catalog.getLesson(base.id, 4))?.blocks.length).toBe(base.blocks.length);
    expect((await catalog.getLesson(base.id, undefined, undefined, true))?.blocks.length).toBe(base.blocks.length);
    expect((await catalog.listTracks()).length).toBe(1);
    expect((await catalog.getTrack(context.track.id))?.modules[0].lessons.length).toBe(2);
    const other = structuredClone(context); other.packId = "fixture.other-context"; other.track.id = "other-track";
    other.track.modules[0].lessons.forEach(l => { l.id += "-other"; });
    await repo.applyTrackPack(other, hashCanonicalJson(other));
    expect((await catalog.getTrack(context.track.id))?.modules[0].lessons.length).toBe(2);
    expect((await catalog.listTracks()).find(t => t.stableId === context.track.id)?.lessonCount).toBe(2);
  });

  it("rejects changed source/activities, colliding or unsafe new blocks and false version reuse", () => {
    const { context, packet } = lessonVersionFixture(true);
    const invalid = [structuredClone(packet), structuredClone(packet), structuredClone(packet), structuredClone(packet)];
    invalid[0].lesson.activities[0].prompt += " changed";
    invalid[1].lesson.blocks.push({ ...invalid[1].lesson.blocks[0] });
    invalid[2].lesson.blocks[3].payload.content = "replaced teaching";
    invalid[3].target.baseHash = "0".repeat(64);
    for (const input of invalid) expect(() => resolveLessonVersionContext([context], input)).toThrow();
  });
});
