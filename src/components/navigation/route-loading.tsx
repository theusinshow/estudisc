import { AppShell } from "@/components/layout/app-shell";

/** Instant feedback while a dynamic study page loads. */
export function RouteLoading({ title, message }: Readonly<{ title: string; message: string }>) {
  return <AppShell><section className="foundation-panel content-panel" aria-busy="true"><h1>{title}</h1><p role="status">{message}</p></section></AppShell>;
}
