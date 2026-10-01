import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin,AccessDeniedError } from "@/features/auth/owner";
import { QuestionAssetRepository,validatePng } from "@/db/repositories/question-asset-repository";
import { getDatabaseUrl } from "@/db/connection";
import { getMemoryStore } from "@/db/repositories/memory-store";
const inputSchema=z.object({id:z.uuid(),questionId:z.string().min(1).max(160),version:z.number().int().positive(),png:z.string().max(7*1024*1024)}).strict();
export async function POST(request:Request){try{await requireAdmin();}catch(error){if(error instanceof AccessDeniedError)return NextResponse.json({code:"admin_required"},{status:403});throw error;}
  const raw=await request.text();if(raw.length>7*1024*1024)return NextResponse.json({code:"too_large"},{status:413});let input;try{input=inputSchema.safeParse(JSON.parse(raw));}catch{return NextResponse.json({code:"invalid_asset"},{status:400});}if(!input.success)return NextResponse.json({code:"invalid_asset"},{status:400});
  try{const bytes=Buffer.from(input.data.png,"base64");if(getDatabaseUrl()==="memory://local"){const dimensions=validatePng(bytes);const store=getMemoryStore();const question=store.packImports.flatMap(entry=>entry.manifest?.schema==="caderno.track.v2"?entry.manifest.questions:[]).find(question=>question.id===input.data.questionId&&question.version===input.data.version);if(!question?.assets.some(asset=>asset.id===input.data.id&&asset.width===dimensions.width&&asset.height===dimensions.height))throw new Error("Asset mismatch");const old=store.questionAssets.find(asset=>asset.id===input.data.id);if(old&&(old.contentHash!==dimensions.contentHash||old.questionId!==input.data.questionId||old.version!==input.data.version))throw new Error("Immutable asset conflict");if(!old)store.questionAssets.push({...input.data,bytes,contentHash:dimensions.contentHash,mimeType:"image/png"});return NextResponse.json({id:input.data.id});}
    return NextResponse.json(await new QuestionAssetRepository().importAsset(input.data.questionId,input.data.version,input.data.id,bytes));
  }catch{return NextResponse.json({code:"asset_conflict"},{status:409});}
}
