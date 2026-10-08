import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin,AccessDeniedError } from "@/features/auth/owner";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getDatabaseUrl } from "@/db/connection";
import { AuthoringContextRepository,MemoryAuthoringContextRepository } from "@/db/repositories/authoring-context-repository";
const schema=z.object({lessonId:z.string().min(1).max(160),version:z.coerce.number().int().positive().max(2147483647).optional()});
export async function GET(request:Request){
  try{const actor=await requireAdmin();if(!getFeatureFlags().FEATURE_CONTENT_HEALTH)return NextResponse.json({code:"feature_disabled"},{status:404});
    const url=new URL(request.url),input=schema.safeParse({lessonId:url.searchParams.get("lessonId"),version:url.searchParams.get("version")??undefined});if(!input.success)return NextResponse.json({code:"invalid_request"},{status:400});
    const context=await(getDatabaseUrl()==="memory://local"?new MemoryAuthoringContextRepository():new AuthoringContextRepository()).get(actor.ownerId,input.data.lessonId,input.data.version);
    return context?NextResponse.json(context):NextResponse.json({code:"source_unavailable"},{status:404});
  }catch(error){if(error instanceof AccessDeniedError)return NextResponse.json({code:"admin_required"},{status:403});throw error;}
}
