// Local demo only: loads the Golden lessons + test-week drafts into a running `memory://local`
// dev server, marked "published" in that disposable memory so a student can try them.
// It never touches a persistent database and approves nothing in the repository.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { DRAFT_SOURCE, expandLessonDraft, loadLessonDrafts } from "./expand-ifsc-lesson-drafts.mjs";

const base = process.argv[2] ?? "http://localhost:3000";
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base)) throw new Error("Demo seed only targets a local dev server.");

const pack = JSON.parse(readFileSync("packs/seeds/ifsc-2027.golden.track.v2.json", "utf8"));
const drafts = loadLessonDrafts().map(expandLessonDraft);
pack.sources.push(DRAFT_SOURCE);
pack.questions.push(...drafts.flatMap(d => d.questions));
for (const { lesson } of drafts) pack.track.modules.find(m => m.subjectCode === lesson.id.split("-")[0]).lessons.push(lesson);
pack.questions.forEach(q => { q.status = "published"; q.exposurePolicy.minimumDaysBetween = 0; });
pack.track.modules.forEach(m => m.lessons.forEach(l => { l.status = "published"; }));

// With code accounts in .env.local (ADR 0031) import routes need an ADMIN session; mint one with the
// local AUTH_SECRET, exactly as the server would after a sign-in.
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require(require.resolve("@next/env", { paths: [require.resolve("next/package.json")] }));
const { combinedEnv } = loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const { getServerEnv } = await import("../src/lib/env.ts");
const env = getServerEnv(combinedEnv);
let cookie = "";
if (env.ESTUDISC_ACCOUNTS?.trim()) {
  const emitWarning = process.emitWarning;
  process.emitWarning = (warning, ...rest) => { if (!String(warning).includes("Module type of")) emitWarning.call(process, warning, ...rest); };
  const { ACCOUNT_SESSION_COOKIE, createAccountSession, parseCodeAccounts } = await import("../src/features/auth/code-accounts.ts");
  const admin = parseCodeAccounts(env.ESTUDISC_ACCOUNTS).find(account => account.role === "ADMIN");
  if (!admin) throw new Error("ESTUDISC_ACCOUNTS has no ADMIN account to load the demo content.");
  cookie = `${ACCOUNT_SESSION_COOKIE}=${createAccountSession(admin, env.AUTH_SECRET)}`;
}

const post = async (path, data) => {
  const response = await fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json", Origin: base, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(data) });
  return `${response.status} ${response.ok ? "ok" : (await response.text()).slice(0, 160)}`;
};
console.log("aulas:", await post("/api/import/track", pack));
const items = pack.questions.filter(q => q.type === "multiple_choice" && q.subjectCode === "MAT").slice(0, 10).map(q => ({ id: q.id, version: q.version }));
console.log("simulado:", await post("/api/admin/assessment-templates", { id: "demo-mat", version: 1, title: "Diagnóstico de Matemática (demo)", kind: "TARGETED_DIAGNOSTIC", trackId: pack.track.id, durationMinutes: 25, items, status: "published" }));
console.log(`Pronto. Abra ${base} — os dados somem quando o servidor reiniciar.`);
