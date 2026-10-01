import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabaseUrl } from "@/db/connection";
import { getMemoryStore } from "@/db/repositories/memory-store";
import { QuestionAssetRepository } from "@/db/repositories/question-asset-repository";
import { getOwnerProfile,AccessDeniedError } from "@/features/auth/owner";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{assetId:string}>}){
  const {assetId}=await params;if(!z.uuid().safeParse(assetId).success)return new NextResponse(null,{status:404});
  try{const profile=await getOwnerProfile();let asset;
    if(getDatabaseUrl()==="memory://local"){const store=getMemoryStore();const row=store.questionAssets.find(asset=>asset.id===assetId);if(row&&(profile.role==="ADMIN"||store.assessmentInstances.some(instance=>instance.ownerId===profile.ownerId&&instance.snapshot.questions.some(item=>item.question.assets.some(asset=>asset.id===assetId)))||store.questionAssistance.some(access=>access.ownerId===profile.ownerId&&access.questionId===row.questionId&&access.version===row.version)))asset=row;}
    else asset=await new QuestionAssetRepository().readAuthorized(assetId,profile);
    if(!asset)return new NextResponse(null,{status:404});return new NextResponse(new Uint8Array(asset.bytes),{headers:{"Content-Type":"image/png","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  }catch(error){if(error instanceof AccessDeniedError)return new NextResponse(null,{status:403});throw error;}
}
