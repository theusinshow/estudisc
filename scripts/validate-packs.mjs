#!/usr/bin/env node
// Content-quality gate for caderno.track.v2 packs. Usage:
//   node scripts/validate-packs.mjs [--json] [--write-baseline] [--no-baseline]
// Rules and limits: scripts/validate-packs.config.json. Known problems: scripts/validate-packs.baseline.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const text = value => typeof value === "string" ? value : "";
const snippet = (value, match) => { const at = Math.max(0, value.indexOf(match) - 30); return value.slice(at, at + 90).replace(/\s+/g, " ").trim(); };

function* blocks(pack) {
  for (const moduleRecord of pack.track?.modules ?? []) for (const lesson of moduleRecord.lessons ?? []) for (const block of lesson.blocks ?? []) yield { lesson, block };
}
function choiceQuestions(pack) {
  return (pack.questions ?? []).filter(question => Array.isArray(question.choices) && question.choices.length >= 2);
}
function hasStimulus(question) {
  return Boolean(question.stimulus && JSON.stringify(question.stimulus).length > 2) || (Array.isArray(question.assets) && question.assets.length > 0);
}
function visibleQuestionText(question) {
  return [["stem", text(question.stem)], ...(question.choices ?? []).map(choice => [`choice ${choice.id}`, text(choice.content)]), ["explanation", typeof question.explanation === "string" ? question.explanation : JSON.stringify(question.explanation ?? "")]];
}

/** Rules that look at one pack. Returns violations: { rule, id, detail, value? }. */
export function validatePack(pack, config) {
  const out = [];
  const rules = config.rules;
  const fields = config.visibleBlockFields;
  for (const [rule, flags] of [["R1", "i"], ["R2", "m"]]) {
    const pattern = new RegExp(rules[rule].pattern, flags);
    for (const { lesson, block } of blocks(pack)) for (const field of fields) {
      const value = text(block.payload?.[field]); const match = value.match(pattern);
      if (match) out.push({ rule, id: `${lesson.id}/${block.id}`, detail: `${field}: …${snippet(value, match[0])}…` });
    }
    for (const question of pack.questions ?? []) for (const [field, value] of visibleQuestionText(question)) {
      const match = value.match(pattern);
      if (match) out.push({ rule, id: question.id, detail: `${field}: …${snippet(value, match[0])}…` });
    }
  }
  const choice = choiceQuestions(pack);
  if (choice.length) {
    const longest = choice.filter(question => {
      const correct = question.choices.find(entry => entry.correct); if (!correct) return false;
      const length = text(correct.content).length;
      return question.choices.every(entry => entry === correct || text(entry.content).length < length);
    });
    const share = longest.length / choice.length;
    if (share > rules.R3.maxShare) out.push({ rule: "R3", id: "*", value: share, detail: `${(share * 100).toFixed(0)}% of ${choice.length} questions (limit ${(rules.R3.maxShare * 100).toFixed(0)}%)` });
    const absolute = new RegExp(rules.R4.pattern, "i");
    const withAbsolute = choice.filter(question => question.choices.some(entry => !entry.correct && absolute.test(text(entry.content))));
    const absShare = withAbsolute.length / choice.length;
    if (absShare > rules.R4.maxShare) out.push({ rule: "R4", id: "*", value: absShare, detail: `${(absShare * 100).toFixed(0)}% of ${choice.length} questions (limit ${(rules.R4.maxShare * 100).toFixed(0)}%)` });
    if (choice.length >= rules.R5.minQuestions) {
      const counts = {}; for (const question of choice) { const id = question.answer?.choiceId; if (id) counts[id] = (counts[id] ?? 0) + 1; }
      for (const letter of ["A", "B", "C", "D", "E"]) {
        const letterShare = (counts[letter] ?? 0) / choice.length;
        if (letterShare < rules.R5.minShare || letterShare > rules.R5.maxShare) out.push({ rule: "R5", id: letter, value: Math.abs(letterShare - 0.2), detail: `${letter} = ${(letterShare * 100).toFixed(0)}% (allowed ${(rules.R5.minShare * 100).toFixed(0)}–${(rules.R5.maxShare * 100).toFixed(0)}%)` });
      }
    }
    for (const question of choice) {
      const correct = question.choices.filter(entry => entry.correct);
      if (correct.length !== 1 || question.answer?.choiceId !== correct[0].id) out.push({ rule: "R6", id: question.id, detail: `answer.choiceId=${question.answer?.choiceId ?? "∅"}, correct=${correct.map(entry => entry.id).join(",") || "none"}` });
    }
  }
  const stems = new Map();
  for (const question of (pack.questions ?? []).filter(entry => !hasStimulus(entry))) {
    const key = text(question.stem).toLowerCase().replace(/\s+/g, " ").trim(); if (!key) continue;
    stems.set(key, [...(stems.get(key) ?? []), question.id]);
  }
  for (const [stem, ids] of stems) if (ids.length > 1) for (const id of ids) out.push({ rule: "R8", id, detail: `same stem as ${ids.filter(other => other !== id).join(", ")}: “${stem.slice(0, 70)}”` });
  return out;
}

/** R7: lesson or question ids shared by different packs (a pack copied to releases is the same pack). */
export function validateAcrossPacks(entries) {
  const out = []; const lessons = new Map(); const questions = new Map();
  for (const { file, pack } of entries) {
    for (const moduleRecord of pack.track?.modules ?? []) for (const lesson of moduleRecord.lessons ?? []) lessons.set(lesson.id, [...(lessons.get(lesson.id) ?? []), { file, packId: pack.packId, title: lesson.title }]);
    for (const question of pack.questions ?? []) questions.set(question.id, [...(questions.get(question.id) ?? []), { file, packId: pack.packId, title: text(question.stem) }]);
  }
  for (const [kind, map] of [["lesson", lessons], ["question", questions]]) for (const [id, uses] of map) {
    const packs = [...new Set(uses.map(use => use.packId))];
    if (packs.length < 2) continue;
    const titles = [...new Set(uses.map(use => use.title))];
    for (const use of uses) out.push({ file: use.file, packId: use.packId, rule: "R7", id: `${kind}:${id}`, detail: `also in ${packs.filter(other => other !== use.packId).join(", ")}${titles.length > 1 ? " with a different title" : ""}` });
  }
  return out;
}

const baselineKey = violation => `${violation.file}|${violation.rule}|${violation.id}`;

/** Known violations warn; new ones keep their rule severity. Aggregate rules fail again if they get worse. */
export function applyBaseline(violations, baseline, config) {
  const known = new Map((baseline?.entries ?? []).map(entry => [baselineKey(entry), entry]));
  return violations.map(violation => {
    const entry = known.get(baselineKey(violation));
    const allowed = config.rules[violation.rule].allow.includes(violation.id);
    const regressed = entry && typeof violation.value === "number" && typeof entry.value === "number" && violation.value > entry.value + 5e-4;
    const severity = allowed ? "allowed" : entry && !regressed ? "warn" : config.rules[violation.rule].severity;
    return { ...violation, severity, baseline: Boolean(entry), regressed: Boolean(regressed) };
  });
}

export function listPackFiles(config, base = root) {
  return config.roots.flatMap(dir => {
    const full = path.join(base, dir); if (!fs.existsSync(full)) return [];
    return fs.readdirSync(full, { recursive: true }).map(String).filter(name => name.endsWith(".pack.json")).map(name => path.join(dir, name).replaceAll("\\", "/"));
  }).sort();
}

export function run({ config, baseline, base = root }) {
  const entries = listPackFiles(config, base).map(file => ({ file, pack: JSON.parse(fs.readFileSync(path.join(base, file), "utf8")) })).filter(entry => entry.pack.schema === "caderno.track.v2");
  const raw = [...entries.flatMap(({ file, pack }) => validatePack(pack, config).map(violation => ({ file, packId: pack.packId, ...violation }))), ...validateAcrossPacks(entries)];
  return { files: entries.map(entry => entry.file), violations: applyBaseline(raw, baseline, config) };
}

function main(argv) {
  const started = Date.now();
  const config = JSON.parse(fs.readFileSync(path.join(here, "validate-packs.config.json"), "utf8"));
  const baselinePath = path.join(here, "validate-packs.baseline.json");
  const baseline = argv.includes("--no-baseline") || !fs.existsSync(baselinePath) ? null : JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  const result = run({ config, baseline: argv.includes("--write-baseline") ? null : baseline });
  if (argv.includes("--write-baseline")) {
    const entries = result.violations.filter(violation => violation.severity !== "allowed").map(({ file, rule, id, value }) => ({ file, rule, id, ...(typeof value === "number" ? { value: Number(value.toFixed(4)) } : {}) }));
    fs.writeFileSync(baselinePath, JSON.stringify({ $comment: "Known violations recorded on creation. Remove entries as content phases fix them; never add new ones to silence a regression.", generatedAt: new Date().toISOString().slice(0, 10), entries }, null, 2) + "\n");
    console.log(`Baseline written: ${entries.length} entries.`);
    return 0;
  }
  const errors = result.violations.filter(violation => violation.severity === "error");
  if (argv.includes("--json")) console.log(JSON.stringify({ files: result.files, errors: errors.length, violations: result.violations }, null, 2));
  else {
    const summary = new Map();
    for (const violation of result.violations) { const key = `${violation.file} ${violation.rule}`; const row = summary.get(key) ?? { error: 0, warn: 0, allowed: 0, sample: violation }; row[violation.severity]++; summary.set(key, row); }
    for (const [key, row] of summary) console.log(`${key.padEnd(72)} error ${String(row.error).padStart(4)}  warn ${String(row.warn).padStart(4)}  e.g. ${row.sample.id}: ${row.sample.detail.slice(0, 80)}`);
    for (const violation of errors.slice(0, 40)) console.log(`ERROR ${violation.rule} ${violation.file} ${violation.id}: ${violation.detail}${violation.regressed ? " (worse than baseline)" : ""}`);
    console.log(`${result.files.length} packs, ${result.violations.length} violations, ${errors.length} errors, ${Date.now() - started} ms`);
  }
  return errors.length ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
