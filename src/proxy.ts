import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { getAuthGuardDecision, isPublicRuntimePath,isAdminRuntimePath } from "@/features/auth/session-guard";
import { isGoogleAuthConfigured } from "@/features/auth/auth-readiness";
import { getServerEnv } from "@/lib/env";
import { isAllowedMutationOrigin } from "@/features/auth/mutation-origin";
import { getAccountConfig } from "@/features/auth/account-mode";
import { ACCOUNT_SESSION_COOKIE, readAccountSession } from "@/features/auth/code-accounts";
import {
  applyBaseSecurityHeaders,
  buildContentSecurityPolicy,
  CSP_NONCE_HEADER
} from "@/lib/security-headers";

type AuthenticatedRequest = NextRequest & {
  auth?: {
    user?: {
      email?: string | null;
    };
  } | null;
};

function createSecurityContext(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const contentSecurityPolicy = buildContentSecurityPolicy({
    nonce,
    isDevelopment: process.env.NODE_ENV !== "production"
  });
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set(CSP_NONCE_HEADER, nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  return { contentSecurityPolicy, requestHeaders };
}

function secureResponse(response: NextResponse, contentSecurityPolicy: string) {
  applyBaseSecurityHeaders(response.headers);
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

function nextSecureResponse(request: NextRequest, contentSecurityPolicy: string, requestHeaders: Headers) {
  const responseHeaders = new Headers();
  applyBaseSecurityHeaders(responseHeaders);
  responseHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  return NextResponse.next({
    headers: responseHeaders,
    request: {
      headers: requestHeaders
    }
  });
}

const authProxy = auth((request: AuthenticatedRequest) => {
  const { pathname } = request.nextUrl;
  const { contentSecurityPolicy, requestHeaders } = createSecurityContext(request);

  if (isPublicRuntimePath(pathname)) {
    return nextSecureResponse(request, contentSecurityPolicy, requestHeaders);
  }

  if(pathname.startsWith("/api/")&&!["GET","HEAD","OPTIONS"].includes(request.method)){
    if(!isAllowedMutationOrigin(request.headers,request.nextUrl,getServerEnv().APP_URL))return secureResponse(NextResponse.json({code:"origin_rejected"},{status:403}),contentSecurityPolicy);
  }

  // Accounts mode (ADR 0031): a signed session cookie replaces the Google check, also in production.
  const accountConfig = getAccountConfig(getServerEnv());
  if (accountConfig) {
    if (pathname === "/api/session") return nextSecureResponse(request, contentSecurityPolicy, requestHeaders);
    const account = readAccountSession(request.cookies.get(ACCOUNT_SESSION_COOKIE)?.value, accountConfig.accounts, accountConfig.secret);
    if (account) {
      if (isAdminRuntimePath(pathname) && account.role !== "ADMIN") {
        // APIs answer 403; pages send the student home instead of showing raw JSON.
        if (pathname.startsWith("/api/")) return secureResponse(NextResponse.json({ code: "admin_required", message: "Esta ação requer perfil de administrador." }, { status: 403 }), contentSecurityPolicy);
        return secureResponse(NextResponse.redirect(new URL("/", request.url)), contentSecurityPolicy);
      }
      return nextSecureResponse(request, contentSecurityPolicy, requestHeaders);
    }
    if (pathname.startsWith("/api/")) return secureResponse(NextResponse.json({ code: "auth_required", message: "Entre com sua conta para continuar." }, { status: 401 }), contentSecurityPolicy);
    const accountSignInUrl = new URL("/auth/signin", request.url);
    accountSignInUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return secureResponse(NextResponse.redirect(accountSignInUrl), contentSecurityPolicy);
  }

  const decision = process.env.NODE_ENV==="production"&&!isGoogleAuthConfigured(getServerEnv())?"forbidden":getAuthGuardDecision(request.auth?.user?.email, getServerEnv());

  if (decision === "allow") {
    const env=getServerEnv();
    if(isAdminRuntimePath(pathname)&&isGoogleAuthConfigured(env)&&!env.KNOW_OS_ADMIN_GOOGLE_EMAILS.includes(request.auth?.user?.email?.trim().toLowerCase()??""))return secureResponse(NextResponse.json({code:"admin_required",message:"Esta ação requer perfil de administrador."},{status:403}),contentSecurityPolicy);
    return nextSecureResponse(request, contentSecurityPolicy, requestHeaders);
  }

  if (pathname.startsWith("/api/")) {
    return secureResponse(
      NextResponse.json(
        {
          code: decision === "unauthenticated" ? "auth_required" : "auth_forbidden",
          message:
            decision === "unauthenticated"
              ? "Autenticação Google é necessária para acessar este recurso."
              : "Esta conta Google não está autorizada para este KNOW/OS."
        },
        { status: decision === "unauthenticated" ? 401 : 403 }
      ),
      contentSecurityPolicy
    );
  }

  const signInUrl = new URL("/auth/signin", request.url);
  signInUrl.searchParams.set("callbackUrl", request.nextUrl.href);
  return secureResponse(NextResponse.redirect(signInUrl), contentSecurityPolicy);
});

export { authProxy as proxy };
export default authProxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)"]
};
