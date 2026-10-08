import { NextResponse } from "next/server";
import { AccessDeniedError } from "@/features/auth/owner";
import { recordMistakeReflection } from "@/features/mistakes/api";
import { mistakeReflectionSchema } from "@/features/mistakes/reflection-contracts";
import { getFeatureFlags } from "@/lib/feature-flags";
export async function POST(request:Request){
  if(!getFeatureFlags().FEATURE_SMART_MISTAKES)return NextResponse.json({code:"feature_disabled"},{status:404});
  const data=mistakeReflectionSchema.safeParse(await request.json().catch(()=>null));
  if(!data.success)return NextResponse.json({code:"invalid_request"},{status:400});
  try{return NextResponse.json({id:await recordMistakeReflection(data.data),basis:"student_report",canonicalEvidence:false});}
  catch(error){
    if(error instanceof AccessDeniedError)return NextResponse.json({code:"forbidden"},{status:403});
    if(error instanceof Error&&error.message==="Mistake unavailable")return NextResponse.json({code:"mistake_unavailable"},{status:404});
    if(error instanceof Error&&error.message==="Reflection conflict")return NextResponse.json({code:"reflection_conflict"},{status:409});
    throw error;
  }
}
