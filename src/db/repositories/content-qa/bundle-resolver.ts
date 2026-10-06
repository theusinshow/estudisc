import {desc} from "drizzle-orm";
import {packImports} from "@/db/schema";
import {trackPackV2Schema} from "@/features/import/application/track-pack-v2-schema";
import {getDatabase} from "@/db/connection";
import type {ContentDatabase} from "./types";
import {ContentReleaseRepository} from "./release-repository";
import {readPublicationDetails,readOnePublicationDetail} from "./publication-reader";
export class ContentBundleResolver {constructor(protected readonly db:ContentDatabase=getDatabase()){}
async lessonBundle(stableId:string,version:number){

    const packs=await this.db.select().from(packImports).orderBy(desc(packImports.importedAt));

    for(const row of packs){const parsed=trackPackV2Schema.safeParse(row.manifest);if(!parsed.success)continue;

      const lesson=parsed.data.track.modules.flatMap(m=>m.lessons).find(l=>l.id===stableId&&l.version===version);if(!lesson)continue;

      const ids=new Set([...lesson.activities.flatMap(a=>a.questionId?[a.questionId]:[]),...lesson.exitTicketQuestionIds]);

      return {lesson,questions:parsed.data.questions.filter(q=>ids.has(q.id))};}

    throw new Error("Lesson version not found in imported packs");

  }
async lessonQueue(){

    const packs=await this.db.select().from(packImports).orderBy(desc(packImports.importedAt));const releases=await new ContentReleaseRepository(this.db).list();

    const status=(type:string,id:string,version:number)=>releases.find(r=>r.targetType===type&&r.stableId===id&&r.version===version);

    const seen=new Set<string>();const queue=[];

    for(const row of packs){const parsed=trackPackV2Schema.safeParse(row.manifest);if(!parsed.success)continue;

      for(const trackModule of parsed.data.track.modules)for(const lesson of trackModule.lessons){const key=`${lesson.id}@${lesson.version}`;if(seen.has(key))continue;seen.add(key);

        const ids=new Set([...lesson.activities.flatMap(a=>a.questionId?[a.questionId]:[]),...lesson.exitTicketQuestionIds]);

        const questions=parsed.data.questions.filter(q=>ids.has(q.id)).map(q=>({id:q.id,version:q.version,release:status("question",q.id,q.version)}));

        queue.push({lesson:{id:lesson.id,version:lesson.version,title:lesson.title,subject:trackModule.subjectCode},release:status("lesson",lesson.id,lesson.version),questions});}}

    const details=await readPublicationDetails(this.db,queue.flatMap(item=>item.release?[item.release.id]:[]));
    return queue.map(item=>({...item,publication:item.release?details.get(item.release.id)??null:null}));

  }
async lessonDetail(stableId:string,version:number){

    const bundle=await this.lessonBundle(stableId,version);const releases=await new ContentReleaseRepository(this.db).list();

    const release=(type:string,id:string,v:number)=>releases.find(r=>r.targetType===type&&r.stableId===id&&r.version===v);

    const target=release("lesson",stableId,version);const publication=target?await readOnePublicationDetail(this.db,target.id):null;
    return {...bundle,publication,lessonRelease:release("lesson",stableId,version),questionReleases:bundle.questions.map(q=>({id:q.id,release:release("question",q.id,q.version)}))};

  }
}
