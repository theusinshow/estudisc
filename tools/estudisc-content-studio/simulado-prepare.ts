import { parseArgs } from "node:util";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { convertChatGptQuestion, convertMathSimulado, lessonConceptIndex, standaloneSets, type ConvertedQuestion } from "./simulado-questions";
import { buildSimuladoTemplate, partitionSimulados, validateSimulado } from "./simulado-builder";

/**
 * Local, offline preparation (ADR 0065): converts authoring JSON into per-Track standalone
 * Question sets and simulado templates. It writes files only; it never touches a database.
 *
 * pnpm exec tsx tools/estudisc-content-studio/simulado-prepare.ts --out .local/simulados \
 *   --pack packs/drafts/ifsc-2027-portuguese/portuguese.pack.json --pack ... \
 *   --chatgpt .local/chatgpt/fix226/POR/POR.json --math .local/chatgpt/mat-sim/MAT-SIM.json \
 *   --track ifsc-2027 --scope ifsc-2027-mathematics --scope ... --count 3 --run-id chatgpt-simulados-2026-10
 */
const { values } = parseArgs({ options: {
  out: { type: "string" }, pack: { type: "string", multiple: true }, chatgpt: { type: "string", multiple: true },
  math: { type: "string" }, "math-track": { type: "string", default: "ifsc-2027-mathematics" },
  track: { type: "string", default: "ifsc-2027" }, scope: { type: "string", multiple: true },
  count: { type: "string", default: "3" }, "run-id": { type: "string" }
} });
const read = (path: string) => JSON.parse(readFileSync(resolve(path), "utf8").replace(/^﻿/, "")) as unknown;
if (!values.out || !values["run-id"] || !values.pack?.length) throw new Error("Required --out, --run-id and at least one --pack");
const runId = values["run-id"];
const packs = values.pack.map(read);
const lessons = lessonConceptIndex(packs);
const converted: ConvertedQuestion[] = [];
for (const path of values.chatgpt ?? []) {
  const file = read(path) as { questions?: unknown[] } | unknown[];
  for (const item of Array.isArray(file) ? file : file.questions ?? []) converted.push(convertChatGptQuestion(item, lessons, runId));
}
if (values.math) {
  const known = new Set([...lessons.values()].filter(lesson => lesson.trackId === values["math-track"]).flatMap(lesson => lesson.conceptIds));
  converted.push(...convertMathSimulado(read(values.math), values["math-track"], known, runId));
}
const sets = standaloneSets(converted);
const count = Number(values.count);
const templates = partitionSimulados(converted, count).map((items, index) => validateSimulado(
  buildSimuladoTemplate({ number: index + 1, trackId: values.track, scopeTrackIds: values.scope, items }),
  converted.map(entry => entry.question), { assumePublished: true }));
const out = resolve(values.out);
mkdirSync(out, { recursive: true });
for (const set of sets) writeFileSync(join(out, `standalone-${set.trackId}.json`), `${JSON.stringify(set, null, 2)}\n`);
for (const template of templates) writeFileSync(join(out, `${template.id}.template.json`), `${JSON.stringify(template, null, 2)}\n`);
console.log(JSON.stringify({ sets: sets.map(set => ({ trackId: set.trackId, questions: set.questions.length })), templates: templates.map(template => template.id) }));
