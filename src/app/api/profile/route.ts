import { NextResponse } from "next/server";
import { getOwnerProfile,AccessDeniedError } from "@/features/auth/owner";
export async function GET(){try{return NextResponse.json({role:(await getOwnerProfile()).role},{headers:{"Cache-Control":"private, no-store"}});}catch(error){if(error instanceof AccessDeniedError)return NextResponse.json({code:"access_denied"},{status:403});throw error;}}
