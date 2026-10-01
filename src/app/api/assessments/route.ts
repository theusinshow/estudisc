import { NextResponse } from "next/server";
import { z } from "zod";
import { assessmentRepository } from "@/features/assessments/api";
import { AssessmentStateError } from "@/db/repositories/assessment-repository";
import { getOwnerId,AccessDeniedError } from "@/features/auth/owner";
const requestSchema=z.object({templateId:z.uuid(),startKey:z.uuid()}).strict();
export async function POST(request:Request){const input=requestSchema.safeParse(await request.json().catch(()=>null));if(!input.success)return NextResponse.json({code:"invalid_request"},{status:400});try{return NextResponse.json(await assessmentRepository().start(await getOwnerId(),input.data.templateId,input.data.startKey));}catch(error){if(error instanceof AccessDeniedError)return NextResponse.json({code:"forbidden"},{status:403});if(error instanceof AssessmentStateError)return NextResponse.json({code:"assessment_unavailable"},{status:409});throw error;}}
