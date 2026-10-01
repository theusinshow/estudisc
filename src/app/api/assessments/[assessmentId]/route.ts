import { NextResponse } from "next/server";
import { z } from "zod";
import { assessmentRepository } from "@/features/assessments/api";
import { AssessmentStateError } from "@/db/repositories/assessment-repository";
import { getOwnerId,AccessDeniedError } from "@/features/auth/owner";
const requestSchema=z.object({questionVersionId:z.uuid(),response:z.json(),flagged:z.boolean().default(false)}).strict();
export async function PATCH(request:Request,{params}:{params:Promise<{assessmentId:string}>}){
  const raw=await request.text();if(raw.length>20000)return NextResponse.json({code:"too_large"},{status:413});let input;try{input=requestSchema.safeParse(JSON.parse(raw));}catch{return NextResponse.json({code:"invalid_request"},{status:400});}
  const {assessmentId}=await params;if(!input.success||!z.uuid().safeParse(assessmentId).success)return NextResponse.json({code:"invalid_request"},{status:400});
  try{return NextResponse.json(await assessmentRepository().save(await getOwnerId(),assessmentId,input.data.questionVersionId,input.data.response,input.data.flagged));}catch(error){if(error instanceof AccessDeniedError)return NextResponse.json({code:"forbidden"},{status:403});if(error instanceof AssessmentStateError)return NextResponse.json({code:"assessment_closed"},{status:409});throw error;}
}
