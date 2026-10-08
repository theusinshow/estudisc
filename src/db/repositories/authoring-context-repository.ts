import { and,desc,eq,sql } from "drizzle-orm";
import type { PgDatabase,PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDatabase } from "@/db/connection";
import { lessons,packImports } from "@/db/schema";
import type * as schema from "@/db/schema";
import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { authoringContextSchema,type AuthoringContext } from "@/features/content-qa/authoring-contracts";
import { getMemoryStore } from "./memory/store";

export function sourceAuthoringBinding(manifests:readonly unknown[],authorId:string,lessonId:string,version?:number,published?:boolean){
  for(const manifest of manifests){const parsed=trackPackV2Schema.safeParse(manifest);if(!parsed.success)continue;const pack=parsed.data;
    for(const moduleRecord of pack.track.modules){const lesson=moduleRecord.lessons.find(lesson=>lesson.id===lessonId&&(version===undefined||lesson.version===version));if(!lesson)continue;
      const ids=[...new Set([...lesson.exitTicketQuestionIds,...lesson.activities.flatMap(activity=>activity.questionId?[activity.questionId]:[])])];
      const refs=ids.map(id=>{const question=pack.questions.find(q=>q.id===id);if(!question)throw new Error("Source Question reference missing");return{id,version:question.version,hash:hashCanonicalJson(question)};});
      const context=authoringContextSchema.parse({authorId,target:{trackId:pack.track.id,trackVersion:pack.version,moduleId:moduleRecord.id,lessonId,baseVersion:lesson.version,baseHash:hashCanonicalJson(lesson)},lesson,questionReferences:refs,published:published??lesson.status==="published",findings:[...(!lesson.objectives.length?["Objetivos editoriais ausentes."]:[]),...(!lesson.sourceIds.length?["Referências de fonte incompletas."]:[]),"Direitos e mapeamento oficial exigem os registros de origem; publicação não os certifica."]});
      const identity={trackId:pack.track.id,trackVersion:pack.version,lessonId,lessonVersion:lesson.version};
      return {context,subjectCode:moduleRecord.subjectCode,blueprintSourceHash:hashCanonicalJson({identity,subjectCode:moduleRecord.subjectCode,lesson})};
    }
  }return null;
}
export function sourceAuthoringContext(manifests:readonly unknown[],authorId:string,lessonId:string,version?:number,published?:boolean):AuthoringContext|null{return sourceAuthoringBinding(manifests,authorId,lessonId,version,published)?.context??null;}
export class AuthoringContextRepository{
  constructor(private readonly db:PgDatabase<PgQueryResultHKT,typeof schema>=getDatabase()){}
  async get(authorId:string,lessonId:string,version?:number){return (await this.getBinding(authorId,lessonId,version))?.context??null;}
  async getBinding(authorId:string,lessonId:string,version?:number){const [row]=await this.db.select().from(lessons).where(and(eq(lessons.stableId,lessonId),version===undefined?undefined:eq(lessons.contentVersion,version))).orderBy(desc(lessons.contentVersion)).limit(1);if(!row)return null;
    const metadata=row.metadata as {status?:string;qaReleaseId?:string};const sources=await this.db.select({manifest:packImports.manifest}).from(packImports).where(sql`${packImports.manifest}->>'schema'='caderno.track.v2'`).orderBy(desc(packImports.importedAt),desc(packImports.id)).limit(250);
    return sourceAuthoringBinding(sources.map(row=>row.manifest),authorId,lessonId,version??row.contentVersion,metadata.status==="published"&&Boolean(metadata.qaReleaseId));}
}
export class MemoryAuthoringContextRepository{
  constructor(private readonly store=getMemoryStore()){}
  async get(authorId:string,lessonId:string,version?:number){return (await this.getBinding(authorId,lessonId,version))?.context??null;}
  async getBinding(authorId:string,lessonId:string,version?:number){return sourceAuthoringBinding([...this.store.packImports].reverse().map(row=>row.manifest),authorId,lessonId,version);}
}
