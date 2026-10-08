import { NextResponse } from "next/server";
import { getOwnerId } from "@/features/auth/owner";
import { getFeatureFlags } from "@/lib/feature-flags";
import { aiRequestSchema } from "@/features/ai/contracts";
import { executeLearningAi } from "@/features/ai/server";
import { aiHttpError } from "@/features/ai/http-errors";

export async function POST(request:Request){
  if(!getFeatureFlags().FEATURE_AI_LEARNING)return NextResponse.json({code:"feature_disabled"},{status:404});
  try{
    const owner=await getOwnerId(),raw=await request.text();
    if(raw.length>12_000)return NextResponse.json({code:"body_too_large"},{status:413});
    const input=aiRequestSchema.safeParse(JSON.parse(raw));
    if(!input.success)return NextResponse.json({code:"invalid_request"},{status:400});
    return NextResponse.json(await executeLearningAi(owner,input.data,request.signal));
  }catch(error){if(error instanceof SyntaxError)return NextResponse.json({code:"invalid_request"},{status:400});return aiHttpError(error);}
}
