import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/** Read the same ordered local stylesheet imports as the application for private static QA. */
export function readApplicationCss(path = "src/app/globals.css", visiting = new Set<string>()): string {
  const file = resolve(path);
  if (visiting.has(file)) throw new Error("Cyclic application stylesheet import");
  visiting.add(file);
  const css = readFileSync(file, "utf8").replace(/@import\s+["']([^"']+)["'];/g, (_, target: string) => target.startsWith(".") ? readApplicationCss(resolve(dirname(file), target), visiting) : "");
  visiting.delete(file);
  return css;
}
