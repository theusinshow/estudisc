import { logEvent } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assessmentRepository } from "@/features/assessments/api";
import { AssessmentStateError } from "@/db/repositories/assessment-repository";
import { getOwnerId,AccessDeniedError } from "@/features/auth/owner";
export async function POST(_request:Request,{params}:{params:Promise<{assessmentId:string}>}){
  const {assessmentId}=await params;if(!z.uuid().safeParse(assessmentId).success)return NextResponse.json({code:"invalid_request"},{status:400});
  try{const result=await assessmentRepository().finalize(await getOwnerId(),assessmentId);logEvent("info","assessment_finalized",{operation:"finalize",status:"FINALIZED"});return NextResponse.json(result);}catch(error){logEvent("warn","assessment_finalize_failure",{operation:"finalize",errorType:error instanceof Error?error.name:"UnknownError"});if(error instanceof AccessDeniedError)return NextResponse.json({code:"forbidden"},{status:403});if(error instanceof AssessmentStateError)return NextResponse.json({code:"assessment_closed"},{status:409});throw error;}
}
