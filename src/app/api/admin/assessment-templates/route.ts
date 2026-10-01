import { NextResponse } from "next/server";
import { assessmentRepository } from "@/features/assessments/api";
import { requireAdmin,AccessDeniedError } from "@/features/auth/owner";
import { assessmentTemplateSchema } from "@/features/assessments/contracts";
export async function POST(request:Request){try{await requireAdmin();}catch(error){if(error instanceof AccessDeniedError)return NextResponse.json({code:"admin_required"},{status:403});throw error;}
  const input=assessmentTemplateSchema.safeParse(await request.json().catch(()=>null));if(!input.success)return NextResponse.json({code:"invalid_template"},{status:400});
  try{return NextResponse.json(await assessmentRepository().importTemplate(input.data),{status:201});}catch{return NextResponse.json({code:"template_unavailable"},{status:409});}
}
