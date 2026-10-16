import { NextResponse } from "next/server";
import { z } from "zod";
import { assessmentRepository } from "@/features/assessments/api";
import { AssessmentStateError } from "@/db/repositories/assessment-repository";
import { getOwnerId,AccessDeniedError } from "@/features/auth/owner";
import { sheetAnswerSchema } from "@/features/assessments/sheet-contracts";
const questionSaveSchema=z.object({questionVersionId:z.uuid(),response:z.json(),flagged:z.boolean().default(false)}).strict();
// ADR 0066: answer sheets save a position and an A–E letter (or null to clear).
const sheetSaveSchema=z.object({position:z.number().int().min(1).max(28),answer:sheetAnswerSchema,flagged:z.boolean().default(false)}).strict();
const requestSchema=z.union([questionSaveSchema,sheetSaveSchema]);
export async function PATCH(request:Request,{params}:{params:Promise<{assessmentId:string}>}){
  const raw=await request.text();if(raw.length>20000)return NextResponse.json({code:"too_large"},{status:413});let input;try{input=requestSchema.safeParse(JSON.parse(raw));}catch{return NextResponse.json({code:"invalid_request"},{status:400});}
  const {assessmentId}=await params;if(!input.success||!z.uuid().safeParse(assessmentId).success)return NextResponse.json({code:"invalid_request"},{status:400});
  try{const repo=assessmentRepository(),ownerId=await getOwnerId(),data=input.data;return NextResponse.json("position" in data?await repo.saveSheet(ownerId,assessmentId,data.position,data.answer,data.flagged):await repo.save(ownerId,assessmentId,data.questionVersionId,data.response,data.flagged));}catch(error){if(error instanceof AccessDeniedError)return NextResponse.json({code:"forbidden"},{status:403});if(error instanceof AssessmentStateError)return NextResponse.json({code:"assessment_closed"},{status:409});throw error;}
}
