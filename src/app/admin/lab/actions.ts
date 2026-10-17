"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/auth/owner";
import { parseThemeCookie, serializeThemeCookie, THEME_COOKIE } from "@/features/design-lab/theme-cookie";

/** Turns the ADMIN-only vibrante preview on (with the chosen palette/type) or off for the whole app. */
export async function setLabTheme(formData: FormData) {
  await requireAdmin();
  const store = await cookies();
  const theme = parseThemeCookie(`vibrante:${String(formData.get("palette"))}:${String(formData.get("type"))}`);
  if (formData.get("apply") === "on" && theme) {
    store.set(THEME_COOKIE, serializeThemeCookie(theme), { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30 });
  } else {
    store.delete(THEME_COOKIE);
  }
  revalidatePath("/", "layout");
}
