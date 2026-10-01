import { NextResponse } from "next/server";
import { requireAdmin,AccessDeniedError } from "@/features/auth/owner";
import { getDatabase,getDatabaseUrl } from "@/db/connection";
import { readJsonRequestWithLimit,validateTrackPack,importTrackPack } from "@/features/import/api";
import { GenerationJobRepository } from "@/db/repositories/generation-job-repository";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { generationSpecSchema } from "@/features/generation/contracts";
import { compileGenerationPrompt } from "@/features/generation/prompt-compiler";
import { generationJobs } from "@/db/schema";
import { and,eq } from "drizzle-orm";
import { z } from "zod";
const requestSchema=z.discriminatedUnion("action",[
  z.object({action:z.literal("compile"),spec:generationSpecSchema}).strict(),
  z.object({action:z.enum(["validate","import"]),jobId:z.uuid(),pack:z.unknown()}).strict()
]);
export async function POST(request:Request){try{
  const {ownerId}=await requireAdmin();if(!getDatabaseUrl()||getDatabaseUrl()==="memory://local")return NextResponse.json({code:"persistent_database_required"},{status:503});
  const raw=await readJsonRequestWithLimit(request);if(!raw.ok)return NextResponse.json({code:raw.code},{status:400});const input=requestSchema.parse(raw.body),db=getDatabase(),jobs=new GenerationJobRepository(db);
  if(input.action==="compile"){
    if(input.spec.targetSchema!=="caderno.track.v2"||!input.spec.sourcePackContext)throw new Error("V2 SourcePack context required");
    const prompt=compileGenerationPrompt(input.spec);const job=await jobs.create({ownerId,mode:"manual_copy_paste",provider:"manual",spec:input.spec,compiledPrompt:prompt,status:"waiting_external_response"});
    return NextResponse.json({jobId:job.id,prompt:`${prompt.prompt}\nGenerationRun ID: ${job.id}`});
  }
  const job=await jobs.get(ownerId,input.jobId);if(!job||job.targetSchema!=="caderno.track.v2")throw new Error("Generation job not found");
  const validation=validateTrackPack(input.pack);if(!validation.ok){await jobs.updateStatus(ownerId,job.id,"invalid");return NextResponse.json({code:"invalid_source_pack",issues:validation.issues},{status:400});}
  const pack=validation.pack;if(pack.schema!=="caderno.track.v2"||pack.questions.some(q=>q.status!=="draft"||q.provenance.type!=="generated"||q.provenance.generationRunId!==job.id)||pack.track.modules.some(m=>m.lessons.some(l=>l.status!=="draft")))throw new Error("Generated versions must be draft and linked to this run");
  await db.update(generationJobs).set({rawResponseMetadataHash:validation.contentHash,validationResult:{valid:true,contentHash:validation.contentHash,questions:pack.questions.length}}).where(and(eq(generationJobs.id,job.id),eq(generationJobs.ownerId,ownerId)));
  await jobs.updateStatus(ownerId,job.id,"ready_to_import");
  if(input.action==="validate")return NextResponse.json({valid:true,contentHash:validation.contentHash});
  const result=await importTrackPack(pack,new DrizzleTrackImportRepository(db,ownerId));if(result.status==="imported"||result.status==="already_imported")await jobs.updateStatus(ownerId,job.id,"imported");return NextResponse.json(result);
}catch(error){return NextResponse.json({code:error instanceof AccessDeniedError?"admin_required":"generation_blocked",message:error instanceof Error?error.message:"Invalid request"},{status:error instanceof AccessDeniedError?403:409});}}
