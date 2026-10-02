import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { getAccountConfig } from "@/features/auth/account-mode";
import { ACCOUNT_SESSION_COOKIE, accountSessionCookieOptions, createAccountSession, verifyAccessCode } from "@/features/auth/code-accounts";
import { clearLoginFailures, loginRetryAfterSeconds, recordLoginFailure } from "@/features/auth/login-throttle";
export const runtime="nodejs";export const dynamic="force-dynamic";
const loginSchema=z.object({accountId:z.string().min(1).max(64),code:z.string().max(12)}).strict();
const noStore={"Cache-Control":"private, no-store"};
// Sign in with a dev-created account and its 6-digit code (ADR 0031).
export async function POST(request:Request){
  const config=getAccountConfig(getServerEnv());
  if(!config)return NextResponse.json({code:"accounts_disabled"},{status:404,headers:noStore});
  let body;try{body=loginSchema.safeParse(await request.json());}catch{return NextResponse.json({code:"invalid_request"},{status:400,headers:noStore});}
  if(!body.success)return NextResponse.json({code:"invalid_request"},{status:400,headers:noStore});
  const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||request.headers.get("x-real-ip")||"local";
  const key=`${ip}:${body.data.accountId}`;
  const retryAfter=loginRetryAfterSeconds(key);
  if(retryAfter>0)return NextResponse.json({code:"too_many_attempts",retryAfter},{status:429,headers:{...noStore,"Retry-After":String(retryAfter)}});
  const account=config.accounts.find(entry=>entry.id===body.data.accountId);
  if(!account||!verifyAccessCode(body.data.code,account.code)){
    recordLoginFailure(key);
    return NextResponse.json({code:"invalid_code"},{status:401,headers:noStore});
  }
  clearLoginFailures(key);
  const response=NextResponse.json({name:account.name,role:account.role},{headers:noStore});
  response.cookies.set(ACCOUNT_SESSION_COOKIE,createAccountSession(account,config.secret),accountSessionCookieOptions(process.env.NODE_ENV==="production"));
  return response;
}
export async function DELETE(){
  const response=NextResponse.json({ok:true},{headers:noStore});
  response.cookies.delete(ACCOUNT_SESSION_COOKIE);
  return response;
}
