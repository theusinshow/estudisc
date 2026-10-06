import {and,asc,desc,eq} from "drizzle-orm";
import {contentQaReviews,contentReleases,lessons,packImports,questionVersions} from "@/db/schema";
import {trackPackV2Schema} from "@/features/import/application/track-pack-v2-schema";
import {qaReviewSchema} from "@/features/content-qa/policy";
import {hashCanonicalJson} from "@/lib/canonical-json";
import {DrizzleQuestionRepository} from "../question-repository";
import { getDatabase } from "@/db/connection";
import type { ContentDatabase } from "./types";

export class ContentReleaseRepository{constructor(protected readonly db:ContentDatabase=getDatabase()){}
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
      await tx.insert(contentQaReviews).values({releaseId,reviewerId,...review});if(release.status==="published"&&review.verdict==="REJECT")await new ContentReleaseRepository(tx).retire(release.id);return {recorded:true};
    });
  }
}
