"use client";

import { LogOut } from "lucide-react";

/** Ends any account or Google session, then returns to sign-in. */
export function SignOutButton() {
  async function signOut() {
    await fetch("/api/session", { method: "DELETE" }).catch(() => {});
    window.location.replace(new URL("/auth/signin", window.location.origin).href);
  }
  return <button type="button" className="hub-link" onClick={() => void signOut()}><LogOut aria-hidden="true" /><span>Sair</span></button>;
}
