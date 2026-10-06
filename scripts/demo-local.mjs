// One command to try the app locally: starts a disposable memory:// dev server, loads the demo
// content (scripts/seed-local-demo.mjs) and opens the browser. Ctrl+C stops everything.
import { spawn, execFile } from "node:child_process";
import { createServer } from "node:net";

const port = await new Promise(resolve => { const probe = createServer().once("error", () => resolve(3300)).once("listening", () => probe.close(() => resolve(3000))).listen(3000); });
const base = `http://localhost:${port}`;
console.log(`Iniciando servidor local em ${base} (dados temporários)...`);
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(port)], {
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, DATABASE_URL: "memory://local", ESTUDISC_OWNER_ID: "local-owner", AUTH_TRUST_HOST: "true" }
});
// Both pipes must be drained: an unread stdout fills its buffer and freezes the server after ~900 requests.
const relay = chunk => { const text = String(chunk); if (/error|⨯|already running/i.test(text) && !/MissingSecret|authjs|assertConfig|hydrated but some attributes/.test(text)) process.stderr.write(text); };
server.stdout.on("data", relay);
server.stderr.on("data", relay);
server.on("exit", code => { console.log(`Servidor encerrado (código ${code}).`); process.exit(code ?? 0); });
process.on("SIGINT", () => server.kill());

for (let attempt = 0; ; attempt++) {
  try { const response = await fetch(base); if (response.ok) break; } catch { /* still starting */ }
  if (attempt > 90) { console.error("O servidor não respondeu em 3 minutos."); server.kill(); process.exit(1); }
  await new Promise(resolve => setTimeout(resolve, 2000));
}
const seed = spawn(process.execPath, ["scripts/seed-local-demo.mjs", base], { stdio: "inherit" });
await new Promise(resolve => seed.on("exit", resolve));
if (process.platform === "win32") execFile("cmd", ["/c", "start", "", base]);
else execFile(process.platform === "darwin" ? "open" : "xdg-open", [base]);
console.log(`\nAbra ${base} se o navegador não abrir sozinho. Ctrl+C para parar.`);
