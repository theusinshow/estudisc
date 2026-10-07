import type { AppliedTrackImport, ExistingPackImport, TrackImportRepository } from "@/features/import/application/track-import-service";
import type { TrackPack } from "@/features/import/application/track-pack-schema";
import { getMemoryStore, summarizePack } from './store';


export class MemoryTrackImportRepository implements TrackImportRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async findPackImport(packId: string, version: number): Promise<ExistingPackImport | null> {
    return this.store.packImports.find((entry) => entry.packId === packId && entry.version === version) ?? null;
  }

  async applyTrackPack(pack: TrackPack, contentHash: string): Promise<AppliedTrackImport> {
    const existing = this.store.packImports.find(
      (entry) => entry.packId === pack.packId && entry.version === pack.version
    );

    if (existing?.contentHash === contentHash) {
      return summarizePack(pack);
    }

    this.store.packImports.push({ packId: pack.packId, version: pack.version, contentHash, manifest: pack });
    this.store.tracks.push({
      stableId: pack.track.id,
      title: pack.track.title,
      description: pack.track.description ?? null,
      contentVersion: pack.version
    });

    let importedLessons = 0;
    let importedActivities = 0;

    pack.track.modules.forEach((module, moduleIndex) => {
      this.store.modules.push({
        stableId: module.id,
        trackStableId: pack.track.id,
        title: module.title,
        orderIndex: moduleIndex
      });

      module.lessons.forEach((lesson, lessonIndex) => {
        this.store.lessons.push({
          stableId: lesson.id,
          moduleStableId: module.id,
          title: lesson.title,
          contentVersion: lesson.version,
          orderIndex: lessonIndex
        });
        importedLessons += 1;

        lesson.concepts.forEach((concept) => {
          this.store.concepts.push({
            stableId: concept.id,
            lessonStableId: lesson.id,
            title: concept.title,
            summary: concept.summary ?? null
          });
        });

        lesson.blocks.forEach((block, blockIndex) => {
          this.store.blocks.push({
            stableId: block.id,
            lessonStableId: lesson.id,
            type: block.type,
            orderIndex: blockIndex,
            payload: pack.schema === "caderno.track.v2" && "payload" in block ? { ...(block.payload as Record<string, unknown>), ...block } : block
          });
        });

        lesson.activities.forEach((activity, activityIndex) => {
          this.store.activities.push({
            stableId: activity.id,
            lessonStableId: lesson.id,
            trackStableId: pack.track.id,
            type: activity.type,
            prompt: activity.prompt,
            orderIndex: activityIndex,
            config: pack.schema === "caderno.track.v2" && "config" in activity ? { ...(activity.config as Record<string, unknown>), ...activity, questionVersion: "questionId" in activity ? pack.questions.find(question => question.id === activity.questionId)?.version : undefined } : activity,
            evaluatorVersion: `${pack.schema}:${pack.version}`
          });
          importedActivities += 1;
        });
      });
    });

    return {
      trackStableId: pack.track.id,
      importedLessons,
      importedActivities
    };
  }
}

export class MemoryCatalogRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async listTracks() {
    return this.store.tracks.map((track) => ({
      stableId: track.stableId,
      title: track.title,
      description: track.description,
      lessonCount: this.store.lessons.filter((lesson) =>
        this.store.modules.some(
          (module) => module.stableId === lesson.moduleStableId && module.trackStableId === track.stableId
        )
      ).length
    }));
  }

  async getTrack(stableId: string) {
    const track = this.store.tracks.find((entry) => entry.stableId === stableId);

    if (!track) {
      return null;
    }

    return {
      stableId: track.stableId,
      title: track.title,
      description: track.description,
      modules: this.store.modules
        .filter((module) => module.trackStableId === stableId)
        .sort((left, right) => left.orderIndex - right.orderIndex)
        .map((module) => ({
          stableId: module.stableId,
          title: module.title,
          lessons: this.store.lessons
            .filter((lesson) => lesson.moduleStableId === module.stableId)
            .sort((left, right) => left.orderIndex - right.orderIndex)
            .map((lesson) => ({
              stableId: lesson.stableId,
              title: lesson.title,
              activityCount: this.store.activities.filter((activity) => activity.lessonStableId === lesson.stableId)
                .length
            }))
        }))
    };
  }

  async getLesson(stableId: string, version?:number,trackId?:string) {
    if(version!==undefined){
      for(const entry of [...this.store.packImports].reverse()){
        const pack=entry.manifest;if(pack?.schema!=="caderno.track.v2"||trackId!==undefined&&pack.track.id!==trackId)continue;
        for(const moduleRecord of pack.track.modules){const lesson=moduleRecord.lessons.find(lesson=>lesson.id===stableId&&lesson.version===version);if(!lesson)continue;
          return {stableId:lesson.id,title:lesson.title,trackStableId:pack.track.id,trackTitle:pack.track.title,metadata:{kind:lesson.kind,status:lesson.status,estimatedMinutes:lesson.estimatedMinutes},resumeScope:lesson.status==="published"?{trackId:pack.track.id,lessonId:lesson.id,version:lesson.version}:undefined,
            concepts:lesson.concepts.map(concept=>({stableId:concept.id,title:concept.title,summary:concept.summary??null})),
            blocks:lesson.blocks.map(block=>({stableId:block.id,type:block.type,payload:block.payload})),
            activities:lesson.activities.map(activity=>({stableId:activity.id,type:activity.type,prompt:activity.prompt,config:activity.type==="question"?{...activity.config,questionId:activity.questionId,questionVersion:activity.config.questionVersion??pack.questions.find(question=>question.id===activity.questionId)?.version}:activity.config}))};
        }
      }
      return null;
    }
    const published = [...this.store.packImports].reverse().flatMap(entry => { const pack = entry.manifest; return pack?.schema === "caderno.track.v2" ? pack.track.modules.flatMap(moduleRecord => moduleRecord.lessons.filter(lesson => lesson.id === stableId).map(lesson => lesson.status === "published" ? { trackId: pack.track.id, lessonId: lesson.id, version: lesson.version } : undefined)) : []; })[0];
    const lesson = this.store.lessons.find((entry) => entry.stableId === stableId);
    const moduleRecord = lesson ? this.store.modules.find((entry) => entry.stableId === lesson.moduleStableId) : null;
    const track = moduleRecord ? this.store.tracks.find((entry) => entry.stableId === moduleRecord.trackStableId) : null;

    if (!lesson || !moduleRecord || !track) {
      return null;
    }

    return {
      stableId: lesson.stableId,
      title: lesson.title,
      trackStableId: track.stableId,
      trackTitle: track.title,
      resumeScope: published,
      concepts: this.store.concepts.filter((concept) => concept.lessonStableId === lesson.stableId),
      blocks: this.store.blocks
        .filter((block) => block.lessonStableId === lesson.stableId)
        .sort((left, right) => left.orderIndex - right.orderIndex),
      activities: this.store.activities
        .filter((activity) => activity.lessonStableId === lesson.stableId)
        .sort((left, right) => left.orderIndex - right.orderIndex)
    };
  }

  async getConcept(stableId: string) {
    const concept = this.store.concepts.find((entry) => entry.stableId === stableId);

    if (!concept) {
      return null;
    }

    return {
      stableId: concept.stableId,
      title: concept.title,
      summary: concept.summary,
      lessons: this.store.lessons
        .filter((lesson) =>
          this.store.concepts.some(
            (entry) => entry.lessonStableId === lesson.stableId && entry.stableId === concept.stableId
          )
        )
        .map((lesson) => {
          const moduleRecord = this.store.modules.find((entry) => entry.stableId === lesson.moduleStableId);
          const track = moduleRecord
            ? this.store.tracks.find((entry) => entry.stableId === moduleRecord.trackStableId)
            : null;

          return {
            stableId: lesson.stableId,
            title: lesson.title,
            trackStableId: track?.stableId ?? "",
            trackTitle: track?.title ?? "",
            activityCount: this.store.activities.filter((activity) => activity.lessonStableId === lesson.stableId)
              .length
          };
        })
    };
  }

  async listKnowledgeMapConcepts() {
    const conceptMap = new Map<
      string,
      {
        stableId: string;
        title: string;
        summary: string | null;
        lessonIds: Set<string>;
        trackTitles: Set<string>;
        areaTitles: Set<string>;
      }
    >();

    for (const concept of this.store.concepts) {
      const existing =
        conceptMap.get(concept.stableId) ??
        ({
          stableId: concept.stableId,
          title: concept.title,
          summary: concept.summary,
          lessonIds: new Set<string>(),
          trackTitles: new Set<string>(),
          areaTitles: new Set<string>()
        });

      existing.lessonIds.add(concept.lessonStableId);

      const lesson = this.store.lessons.find((entry) => entry.stableId === concept.lessonStableId);
      const moduleRecord = lesson ? this.store.modules.find((entry) => entry.stableId === lesson.moduleStableId) : null;
      const track = moduleRecord ? this.store.tracks.find((entry) => entry.stableId === moduleRecord.trackStableId) : null;

      if (track) {
        existing.trackTitles.add(track.title);
      }

      if (moduleRecord) {
        existing.areaTitles.add(moduleRecord.title);
      }

      conceptMap.set(concept.stableId, existing);
    }

    return Array.from(conceptMap.values())
      .map((concept) => ({
        stableId: concept.stableId,
        title: concept.title,
        summary: concept.summary,
        lessonCount: concept.lessonIds.size,
        trackTitles: Array.from(concept.trackTitles).sort((left, right) => left.localeCompare(right)),
        areaTitles: Array.from(concept.areaTitles).sort((left, right) => left.localeCompare(right))
      }))
      .sort((left, right) => left.title.localeCompare(right.title));
  }
}
