import { createHash } from "node:crypto";
import { and,eq } from "drizzle-orm";
import type { PgDatabase,PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDatabase } from "@/db/connection";
import type * as schema from "@/db/schema";
import { assessmentInstances,questionAssets,questionAssistance,questionVersions } from "@/db/schema";
import { DrizzleQuestionRepository } from "./question-repository";
import { assessmentSnapshotSchema } from "@/features/assessments/contracts";
import { questionSchema } from "@/features/questions/contracts";
import { canExposeQuestion } from "@/features/questions/exposure";
type Database=PgDatabase<PgQueryResultHKT,typeof schema>;
export function validatePng(bytes:Buffer){if(bytes.length>5*1024*1024||bytes.length<24||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error("Invalid PNG asset");const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);if(!width||!height||width*height>16000000)throw new Error("Invalid image dimensions");return {width,height,contentHash:createHash("sha256").update(bytes).digest("hex")};}
export class QuestionAssetRepository{
  constructor(private readonly db:Database=getDatabase()){}
  async importAsset(questionId:string,version:number,id:string,bytes:Buffer){
    const dimensions=validatePng(bytes);const bank=await new DrizzleQuestionRepository(this.db).getVersion(questionId,version);const asset=bank?.question.assets.find(asset=>asset.id===id);if(!bank||!asset||asset.width!==dimensions.width||asset.height!==dimensions.height)throw new Error("Asset does not match frozen Question");
    const [created]=await this.db.insert(questionAssets).values({id,questionVersionId:bank.versionId,...dimensions,mimeType:"image/png",bytes,alt:asset.alt}).onConflictDoNothing().returning({id:questionAssets.id});
    if(!created){const [old]=await this.db.select({contentHash:questionAssets.contentHash,versionId:questionAssets.questionVersionId}).from(questionAssets).where(eq(questionAssets.id,id));if(old?.contentHash!==dimensions.contentHash||old.versionId!==bank.versionId)throw new Error("Immutable asset conflict");}
    return {id};
  }
  async readAuthorized(id:string,profile:{ownerId:string;role:"ADMIN"|"STUDENT"}){
    const [row]=await this.db.select().from(questionAssets).where(eq(questionAssets.id,id));if(!row)return null;if(profile.role==="ADMIN")return row;
    const instances=await this.db.select({snapshot:assessmentInstances.snapshot}).from(assessmentInstances).where(eq(assessmentInstances.ownerId,profile.ownerId));
    if(instances.some(instance=>assessmentSnapshotSchema.parse(instance.snapshot).questions.some(item=>item.versionId===row.questionVersionId)))return row;
    const [version]=await this.db.select().from(questionVersions).where(eq(questionVersions.id,row.questionVersionId));if(!version)return null;
    const question=questionSchema.parse({...version.content as object,status:version.status});if(!canExposeQuestion(question,{now:new Date(),context:"training"}))return null;
    const [access]=await this.db.select({id:questionAssistance.id}).from(questionAssistance).where(and(eq(questionAssistance.ownerId,profile.ownerId),eq(questionAssistance.questionVersionId,row.questionVersionId)));return access?row:null;
  }
}
