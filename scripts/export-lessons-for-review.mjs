// Exports lessons of the Week 1 release pack as readable Markdown plus phone-width PNG figures, so an
// external reviewer (human or another AI) can judge them without the app. Output stays in .local/ (ignored).
// Usage: node scripts/export-lessons-for-review.mjs [outputDir]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const outputDir = process.argv[2] ?? ".local/revisao-semana-1";
const pack = JSON.parse(readFileSync("packs/releases/ifsc-week-1.pack.json", "utf8"));
const questions = new Map(pack.questions.map(question => [question.id, question]));
const LETTERS = "ABCDE";
mkdirSync(join(outputDir, "figuras"), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 });

function interaction(block) {
  const p = block.payload;
  const lines = [`**Atividade (${block.type}):** ${p.title ?? ""}`, p.instructions ? `_${p.instructions}_` : ""];
  if (p.type === "classification" || p.type === "matching") for (const item of p.items) lines.push(`- ${item.label} → ${p.destinations.find(d => d.id === p.expected[item.id])?.label}`);
  if (p.type === "ordering") lines.push(`Ordem correta: ${p.expectedOrder.map(id => p.items.find(i => i.id === id)?.label).join(" → ")}`);
  if (p.type === "text-highlight") for (const item of p.items) lines.push(`- ${p.expectedIds.includes(item.id) ? "[EVIDÊNCIA] " : ""}${item.label}`);
  if (p.type === "guided-steps") for (const step of p.steps) lines.push(`- ${step.prompt} → ${step.expected}`);
  if (p.hints?.length) lines.push(`Dicas: ${p.hints.join(" | ")}`);
  if (p.explanation) lines.push(`Explicação: ${p.explanation}`);
  return lines.filter(Boolean).join("\n");
}

for (const trackModule of pack.track.modules) for (const lesson of trackModule.lessons) {
  const md = [`# ${lesson.id} — ${lesson.title}`, `Área: ${trackModule.title} · ${lesson.estimatedMinutes} min · status: ${lesson.status}`, "", `Conceitos: ${lesson.concepts.map(c => `${c.title} (${c.id})`).join("; ")}`, "", "## Aula (na ordem em que o aluno vê)"];
  let figure = 0;
  for (const block of lesson.blocks) {
    const p = block.payload;
    if (block.type === "figure") {
      figure += 1;
      const file = `${lesson.id}-figura-${figure}.png`;
      await page.setContent(`<body style="margin:0;background:#FFF4E0"><img id="f" style="width:343px;display:block" src="${p.src}"></body>`);
      await page.locator("#f").screenshot({ path: join(outputDir, "figuras", file) });
      md.push(`\n**[Figura ${figure}: figuras/${file}]** ${p.caption}\n- Texto alternativo: ${p.alt}\n- Descrição completa: ${(p.longDescription ?? "").replace(/\n/g, " ")}\n- Crédito: ${p.credit ?? "—"}`);
    } else if (["classification", "ordering", "matching", "text-highlight", "guided-steps"].includes(block.type)) md.push(`\n${interaction(block)}`);
    else md.push(`\n**[${block.type}]** ${p.title ? `**${p.title}** — ` : ""}${p.content ?? ""}`);
  }
  md.push("", "## Questões");
  for (const activity of lesson.activities.filter(a => a.questionId)) {
    const q = questions.get(activity.questionId);
    const exit = lesson.exitTicketQuestionIds.includes(q.id) ? " · DESAFIO FINAL" : "";
    md.push(`\n### ${q.id}${exit} (${q.difficulty})`);
    if (q.stimulus) md.push(`> ${q.stimulus.replace(/\n/g, "\n> ")}`);
    md.push(q.stem);
    if (q.choices?.length) md.push(q.choices.map((c, i) => `${LETTERS[i]}) ${c.content}${c.correct ? "  ← GABARITO" : ""}`).join("\n"));
    else md.push(`Resposta: ${JSON.stringify(q.answer)}`);
    md.push(`Explicação: ${q.explanation}`);
    const hints = activity.config?.hints ?? [];
    if (hints.length) md.push(`Dicas: ${hints.join(" | ")}`);
  }
  writeFileSync(join(outputDir, `${lesson.id}.md`), md.join("\n"));
  console.log(`${lesson.id}: ${figure} figura(s)`);
}
await browser.close();
console.log(`Exportado em ${outputDir}`);
