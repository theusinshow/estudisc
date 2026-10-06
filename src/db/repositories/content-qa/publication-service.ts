import {and,asc,eq} from "drizzle-orm";
import {contentPublicationEvents,contentQaReviews,contentReleases,lessons,questionAssets,questionVersions,questions,lessonConcepts,questionConcepts} from "@/db/schema";
import {qaReviewSchema,publicationIssues} from "@/features/content-qa/policy";
import {AccessDeniedError,type OwnerProfile} from "@/features/auth/owner";
import {directPublicationSchema} from "@/features/content-qa/direct-publication";
import {DrizzleQuestionRepository} from "../question-repository";
import { getDatabase } from "@/db/connection";
import type { ContentDatabase } from "./types";
import {ContentReleaseRepository} from "./release-repository";
import {ContentBundleResolver} from "./bundle-resolver";

export class ContentPublicationService{constructor(protected readonly db:ContentDatabase=getDatabase()){}
async publish(releaseId:string,actorId?:string){return this.publishRelease(releaseId,undefined,actorId);}
private async publishRelease(releaseId:string,direct?:Readonly<{actorId:string;reason:string}>,editorialActorId?:string){return this.db.transaction(async tx=>{
    const [release]=await tx.select().from(contentReleases).where(eq(contentReleases.id,releaseId)).for("update");if(!release)throw new Error("Release not found");
    if(release.status==="retired")throw new Error("Retired version requires a new content version");
    if(!direct){
      const reviews=await tx.select().from(contentQaReviews).where(eq(contentQaReviews.releaseId,releaseId)).orderBy(asc(contentQaReviews.createdAt));
      const issues=publicationIssues(release.authorId,reviews.map(r=>({...qaReviewSchema.parse({layer:r.layer,verdict:r.verdict,rationale:r.rationale,findings:r.findings}),reviewerId:r.reviewerId})));
      if(issues.length)throw new Error(`QA blocks publication: ${issues.join(",")}`);
    }
    if(release.status==="published")return {published:true};
    if(release.targetType==="question"){
      const bank=await new DrizzleQuestionRepository(tx).getVersion(release.stableId,release.version);if(!bank)throw new Error("Question not found");
      for(const asset of bank.question.assets){const [row]=await tx.select().from(questionAssets).where(eq(questionAssets.id,asset.id));if(!row||row.questionVersionId!==bank.versionId)throw new Error("Source asset missing");}
      await tx.update(questionVersions).set({status:bank.question.status==="annulled"?"annulled":"published"}).where(eq(questionVersions.id,bank.versionId));
    }else if(release.targetType==="lesson"){
      const [lesson]=await tx.select().from(lessons).where(and(eq(lessons.stableId,release.stableId),eq(lessons.contentVersion,release.version)));
      if(!lesson)throw new Error("Lesson not found");const metadata=lesson.metadata as {exitTicketQuestionIds?:string[];objectives?:string[]};
      if(!direct){
        if(!metadata.objectives?.length||!metadata.exitTicketQuestionIds?.length)throw new Error("Objectives and exit ticket required");
        const conceptLinks=await tx.select().from(lessonConcepts).where(eq(lessonConcepts.lessonId,lesson.id));
        for(const link of conceptLinks){const pool=await tx.select().from(questionConcepts).innerJoin(questionVersions,eq(questionVersions.id,questionConcepts.questionVersionId)).where(and(eq(questionConcepts.conceptId,link.conceptId),eq(questionVersions.status,"published")));
          if(pool.filter(row=>!(row.question_versions.content as {exposurePolicy?:{reservedForAssessment?:boolean}}).exposurePolicy?.reservedForAssessment).length<2)throw new Error("At least two published training questions per Concept required");}
      }
      for(const id of metadata.exitTicketQuestionIds??[]){const rows=await tx.select().from(questionVersions).innerJoin(questions,eq(questions.id,questionVersions.questionId)).where(and(eq(questions.stableId,id),eq(questionVersions.status,"published")));if(!rows.length)throw new Error("Exit ticket not published");}
      await tx.update(lessons).set({metadata:{...metadata,status:"published",qaReleaseId:release.id}}).where(and(eq(lessons.stableId,release.stableId),eq(lessons.contentVersion,release.version)));
    }
    await tx.update(contentReleases).set({status:"published"}).where(eq(contentReleases.id,releaseId));
    if(direct)await tx.insert(contentPublicationEvents).values({releaseId,actorId:direct.actorId,mode:"admin_direct",reason:direct.reason});
    else if(editorialActorId)await tx.insert(contentPublicationEvents).values({releaseId,actorId:editorialActorId,mode:"editorial_reviewed",reason:"Published after four recorded independent editorial approvals and structural checks."});
    return {published:true};
  });}
async publishLessonsDirect(actor:OwnerProfile,input:unknown){
    if(actor.role!=="ADMIN"||!actor.ownerId.trim())throw new AccessDeniedError();
    const request=directPublicationSchema.parse(input);
    return this.db.transaction(async tx=>{
      const repo=new ContentPublicationService(tx);
      const releases=await new ContentReleaseRepository(tx).list();
      const find=(type:string,id:string,version:number)=>{
        const release=releases.find(row=>row.targetType===type&&row.stableId===id&&row.version===version);
        if(!release)throw new Error(`Release not registered: ${type} ${id} v${version}`);
        return release;
      };
      const questionReleases=new Map<string,typeof releases[number]>();
      const lessonReleases=[];
      for(const target of request.lessons){
        const bundle=await new ContentBundleResolver(tx).lessonBundle(target.lessonId,target.version);
        for(const question of bundle.questions){
          const release=find("question",question.id,question.version);
          questionReleases.set(release.id,release);
        }
        lessonReleases.push(find("lesson",target.lessonId,target.version));
      }
      const bundle=[...questionReleases.values(),...lessonReleases];
      // A stable lock order prevents two overlapping administrative batches deadlocking.
      const locked=[];
      for(const release of [...bundle].sort((a,b)=>a.id.localeCompare(b.id))){
        const [current]=await tx.select().from(contentReleases).where(eq(contentReleases.id,release.id)).for("update");
        if(!current)throw new Error("Release not found");
        if(current.status==="retired")throw new Error("Retired version requires a new content version");
        locked.push(current);
      }
      for(const release of bundle)await repo.publishRelease(release.id,{actorId:actor.ownerId,reason:request.reason});
      return {published:true,lessons:request.lessons.length,releases:bundle.length,newlyPublished:locked.filter(row=>row.status!=="published").length};
    });
  }
}
