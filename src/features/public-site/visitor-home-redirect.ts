import { NextResponse } from "next/server";
import { MAIN_PUBLIC_PATH } from "@/features/public-site/seo";

/** Permanent so crawlers consolidate "/" onto the public home. */
export const VISITOR_HOME_REDIRECT_STATUS = 301;

/**
 * Signed-out visitors opening "/" go to the public home (`/conheca`).
 * The 301 is not stored: after sign-in, "/" is the study app and must still load.
 */
export function visitorHomeRedirect(requestUrl: string) {
  const response = NextResponse.redirect(new URL(MAIN_PUBLIC_PATH, requestUrl), VISITOR_HOME_REDIRECT_STATUS);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
