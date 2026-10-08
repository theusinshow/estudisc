import { NextResponse } from "next/server";
import { z,ZodError } from "zod";
import { requireAdmin,AccessDeniedError } from "@/features/auth/owner";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getDatabaseUrl } from "@/db/connection";
import { readJsonRequestWithLimit } from "@/features/import/api";
import { AuthoringContextRepository,MemoryAuthoringContextRepository } from "@/db/repositories/authoring-context-repository";
import { previewAuthoringMetadata } from "@/features/content-qa/metadata-preview";
const schema=z.object({kind:z.enum(["blueprint","assets"]),data:z.unknown(),lessonId:z.string().min(1).max(160).optional(),version:z.number().int().positive().optional()}).strict();
export async function POST(request:Request){try{
  const actor=await requireAdmin();if(!getFeatureFlags().FEATURE_CONTENT_HEALTH)return NextResponse.json({code:"feature_disabled"},{status:404});
  const raw=await readJsonRequestWithLimit(request,2_000_000);if(!raw.ok)return NextResponse.json({code:raw.code},{status:raw.code==="payload_too_large"?413:400});
  const input=schema.parse(raw.body);const binding=input.kind==="blueprint"&&input.lessonId?await(getDatabaseUrl()==="memory://local"?new MemoryAuthoringContextRepository():new AuthoringContextRepository()).getBinding(actor.ownerId,input.lessonId,input.version):null;
  return NextResponse.json(previewAuthoringMetadata(input.kind,input.data,binding?.context,binding??undefined));
}catch(error){if(error instanceof AccessDeniedError)return NextResponse.json({code:"admin_required"},{status:403});if(error instanceof ZodError)return NextResponse.json({code:"invalid_metadata",message:"O arquivo não segue o formato de metadata do Studio."},{status:400});throw error;}}
