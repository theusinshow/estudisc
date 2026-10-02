import { NextResponse } from "next/server";
import { getOwnerProfile,AccessDeniedError } from "@/features/auth/owner";
import { getAccountConfig } from "@/features/auth/account-mode";
import { getServerEnv } from "@/lib/env";
export async function GET(){try{const profile=await getOwnerProfile();return NextResponse.json({role:profile.role,name:profile.name??null,accountMode:Boolean(getAccountConfig(getServerEnv()))},{headers:{"Cache-Control":"private, no-store"}});}catch(error){if(error instanceof AccessDeniedError)return NextResponse.json({code:"access_denied"},{status:403});throw error;}}
