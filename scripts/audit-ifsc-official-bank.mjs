// Read-only pre-review of the private official bank. It flags likely OCR/representation defects
// for human reviewers; it never edits Questions, keys or classifications and approves nothing.
import { readFileSync, writeFileSync } from "node:fs";

const dir = ".local/ifsc-official";
const bank = JSON.parse(readFileSync(`${dir}/bank.draft.json`, "utf8"));
const classification = new Map(bank.classification.map(entry => [entry.id, entry]));
const PAGE_ARTIFACT = /PRÓ-REITORIA|INSTITUTO FEDERAL|Santa Catarina\s*$|P[áa]gina\s+\d+|\bIFSC\b.*\d{4}\.\d/m;
const VISUAL_REFERENCE = /\b(figura|gr[áa]fico|tabela|imagem|mapa|charge|tirinha|ilustra[çc][ãa]o|quadro)\b/i;
const TEXT_REFERENCE = /\bTexto\s+[IVXL]+\b/;

export function auditQuestion(question) {
  const flags = [];
  const choices = question.choices ?? [];
  const text = [question.stimulus ?? "", question.stem, ...choices.map(choice => choice.content)].join("\n");
  if (choices.some(choice => PAGE_ARTIFACT.test(choice.content)) || PAGE_ARTIFACT.test(question.stem)) flags.push("page_header_footer_leak");
  if (/\p{L}-\n\p{L}/u.test(text)) flags.push("hyphenated_line_break");
  if (choices.some(choice => choice.content.includes("\n"))) flags.push("line_break_in_choice");
  if (question.type === "multiple_choice" && choices.length !== 5) flags.push(`choice_count_${choices.length}`);
  if (choices.some(choice => !choice.content.trim())) flags.push("empty_choice");
  if (TEXT_REFERENCE.test(text) && !question.stimulus) flags.push("referenced_text_not_attached");
  if (VISUAL_REFERENCE.test(text) && !question.assets?.length) flags.push("visual_reference_without_asset");
  if (question.assets?.length) flags.push("asset_alt_text_needs_check");
  if (question.examId === "IFSC-INT-2025.2" || question.provenance?.examId === "IFSC-INT-2025.2") flags.push("ocr_source_2025_2");
  return flags;
}

const rows = bank.questions.map(question => {
  const entry = classification.get(question.id);
  return { id: question.id, status: question.status, reserved: question.exposurePolicy?.reservedForAssessment === true, proposedConcept: question.primaryConceptId, classificationStatus: entry?.classificationStatus ?? "missing", representationStatus: entry?.representationStatus ?? "missing", flags: auditQuestion(question), humanDecision: null };
});
const summary = { questions: rows.length, withFlags: rows.filter(row => row.flags.length).length, byFlag: Object.fromEntries([...new Set(rows.flatMap(row => row.flags))].sort().map(flag => [flag, rows.filter(row => row.flags.includes(flag)).length])), classificationPending: rows.filter(row => row.classificationStatus !== "validated").length, approved: false };
writeFileSync(`${dir}/official-review.checklist.json`, `${JSON.stringify({ generatedAt: new Date().toISOString(), note: "Automated pre-review only. Human reviewers fill humanDecision; nothing here approves content.", summary, rows }, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
