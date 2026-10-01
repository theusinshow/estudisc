import { and,asc,desc,eq } from "drizzle-orm";
import type { PgDatabase,PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDatabase } from "@/db/connection";
import type * as schema from "@/db/schema";
import { contentQaReviews,contentReleases,lessons,packImports,questionAssets,questionVersions,questions,lessonConcepts,questionConcepts } from "@/db/schema";
import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";
import { qaReviewSchema,publicationIssues } from "@/features/content-qa/policy";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { DrizzleQuestionRepository } from "./question-repository";
type Database=PgDatabase<PgQueryResultHKT,typeof schema>;
export class ContentQaRepository {
  constructor(private readonly db:Database=getDatabase()){}
  async list(){return this.db.select().from(contentReleases).orderBy(asc(contentReleases.createdAt));}
  async retire(releaseId:string){return this.db.transaction(async tx=>{
    const [release]=await tx.select().from(contentReleases).where(eq(contentReleases.id,releaseId)).for("update");if(!release)throw new Error("Release not found");
    if(release.targetType==="question"){
      const bank=await new DrizzleQuestionRepository(tx).getVersion(release.stableId,release.version);if(bank&&bank.question.status!=="annulled")await tx.update(questionVersions).set({status:"retired"}).where(eq(questionVersions.id,bank.versionId));
    }else if(release.targetType==="lesson"){
      const rows=await tx.select().from(lessons).where(and(eq(lessons.stableId,release.stableId),eq(lessons.contentVersion,release.version)));
      for(const row of rows)await tx.update(lessons).set({metadata:{...row.metadata as object,status:"retired"}}).where(eq(lessons.id,row.id));
    }
    await tx.update(contentReleases).set({status:"retired"}).where(eq(contentReleases.id,releaseId));return {retired:true};
  });}
  async register(authorId:string,targetType:"lesson"|"question"|"curriculum",stableId:string,version:number){
    const packs=await this.db.select().from(packImports).orderBy(desc(packImports.importedAt));let target:unknown;
    for(const row of packs){const parsed=trackPackV2Schema.safeParse(row.manifest);if(!parsed.success)continue;
      target=targetType==="curriculum"&&parsed.data.track.id===stableId&&parsed.data.version===version?{requirements:parsed.data.curriculumRequirements,sources:parsed.data.sources,prerequisites:parsed.data.conceptPrerequisites}:targetType==="question"?parsed.data.questions.find(q=>q.id===stableId&&q.version===version):targetType==="lesson"?parsed.data.track.modules.flatMap(m=>m.lessons).find(l=>l.id===stableId&&l.version===version):undefined;if(target)break;}
    if(!target)throw new Error("Content version not found");
    const contentHash=hashCanonicalJson(target);
    const [created]=await this.db.insert(contentReleases).values({targetType,stableId,version,contentHash,authorId}).onConflictDoNothing().returning();
    const [row]=created?[created]:await this.db.select().from(contentReleases).where(and(eq(contentReleases.targetType,targetType),eq(contentReleases.stableId,stableId),eq(contentReleases.version,version)));
    if(row.contentHash!==contentHash)throw new Error("Immutable content conflict");return row;
  }
  async review(reviewerId:string,releaseId:string,input:unknown){
    const review=qaReviewSchema.parse(input);
    return this.db.transaction(async tx=>{
      const [release]=await tx.select().from(contentReleases).where(eq(contentReleases.id,releaseId)).for("update");
      if(!release||release.authorId===reviewerId||release.status==="retired")throw new Error("Independent reviewer required for active version");
      if(release.status==="published"&&review.verdict==="APPROVE")throw new Error("Published version cannot receive a new approval");
      await tx.insert(contentQaReviews).values({releaseId,reviewerId,...review});if(release.status==="published"&&review.verdict==="REJECT")await new ContentQaRepository(tx).retire(release.id);return {recorded:true};
    });
  }
  async publish(releaseId:string){return this.db.transaction(async tx=>{
    const [release]=await tx.select().from(contentReleases).where(eq(contentReleases.id,releaseId)).for("update");if(!release)throw new Error("Release not found");
    if(release.status==="retired")throw new Error("Retired version requires a new content version");
    const reviews=await tx.select().from(contentQaReviews).where(eq(contentQaReviews.releaseId,releaseId)).orderBy(asc(contentQaReviews.createdAt));
    const issues=publicationIssues(release.authorId,reviews.map(r=>({...qaReviewSchema.parse({layer:r.layer,verdict:r.verdict,rationale:r.rationale,findings:r.findings}),reviewerId:r.reviewerId})));
    if(issues.length)throw new Error(`QA blocks publication: ${issues.join(",")}`);
    if(release.status==="published")return {published:true};
    if(release.targetType==="question"){
      const bank=await new DrizzleQuestionRepository(tx).getVersion(release.stableId,release.version);if(!bank)throw new Error("Question not found");
      for(const asset of bank.question.assets){const [row]=await tx.select().from(questionAssets).where(eq(questionAssets.id,asset.id));if(!row||row.questionVersionId!==bank.versionId)throw new Error("Source asset missing");}
      await tx.update(questionVersions).set({status:bank.question.status==="annulled"?"annulled":"published"}).where(eq(questionVersions.id,bank.versionId));
    }else if(release.targetType==="lesson"){
      const [lesson]=await tx.select().from(lessons).where(and(eq(lessons.stableId,release.stableId),eq(lessons.contentVersion,release.version)));
      if(!lesson)throw new Error("Lesson not found");const metadata=lesson.metadata as {exitTicketQuestionIds?:string[];objectives?:string[]};
      if(!metadata.objectives?.length||!metadata.exitTicketQuestionIds?.length)throw new Error("Objectives and exit ticket required");
      const conceptLinks=await tx.select().from(lessonConcepts).where(eq(lessonConcepts.lessonId,lesson.id));
      for(const link of conceptLinks){const pool=await tx.select().from(questionConcepts).innerJoin(questionVersions,eq(questionVersions.id,questionConcepts.questionVersionId)).where(and(eq(questionConcepts.conceptId,link.conceptId),eq(questionVersions.status,"published")));
        if(pool.filter(row=>!(row.question_versions.content as {exposurePolicy?:{reservedForAssessment?:boolean}}).exposurePolicy?.reservedForAssessment).length<2)throw new Error("At least two published training questions per Concept required");}
      for(const id of metadata.exitTicketQuestionIds){const rows=await tx.select().from(questionVersions).innerJoin(questions,eq(questions.id,questionVersions.questionId)).where(and(eq(questions.stableId,id),eq(questionVersions.status,"published")));if(!rows.length)throw new Error("Exit ticket not published");}
      await tx.update(lessons).set({metadata:{...metadata,status:"published",qaReleaseId:release.id}}).where(and(eq(lessons.stableId,release.stableId),eq(lessons.contentVersion,release.version)));
    }
    await tx.update(contentReleases).set({status:"published"}).where(eq(contentReleases.id,releaseId));return {published:true};
  });}
}
