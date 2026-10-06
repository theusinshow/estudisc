import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { trackPackV2Schema } from "../src/features/import/application/track-pack-v2-schema";
import { libraryMetadataSchema, subjects, taxonomySchema, type Taxonomy } from "./contracts";
import { validateLibrary } from "./library";

const root = resolve(import.meta.dirname, "..");
const library = resolve(root, "vecta-source-library");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

function buildTaxonomy(): Taxonomy {
  const origins: Taxonomy["origins"] = [];
  const lessons = new Map<string, Taxonomy["lessons"][number]>();
  const concepts = new Map<string, Taxonomy["concepts"][number]>();
  const addOrigin = (path: string) => {
    const raw = read(path);
    origins.push({ path, sha256: createHash("sha256").update(raw).digest("hex") });
    return raw;
  };
  const add = (subject: "MAT" | "POR" | "CIE" | "GH", lessonId: string, topic: string, ids: string[], origin: string, seedPresent: boolean) => {
    const lesson = lessons.get(lessonId) ?? { subject, id: lessonId, topic, conceptIds: [] };
    for (const id of ids) {
      if (!lesson.conceptIds.includes(id)) lesson.conceptIds.push(id);
      const concept = concepts.get(id) ?? { id, subjects: [], lessonIds: [], origins: [], seedPresent: false };
      if (!concept.subjects.includes(subject)) concept.subjects.push(subject);
      if (!concept.lessonIds.includes(lessonId)) concept.lessonIds.push(lessonId);
      if (!concept.origins.includes(origin)) concept.origins.push(origin);
      concept.seedPresent ||= seedPresent;
      concepts.set(id, concept);
    }
    lessons.set(lessonId, lesson);
  };
  const docs = { MAT: "MATHEMATICS", POR: "PORTUGUESE", CIE: "SCIENCE", GH: "HISTORY-GEOGRAPHY" } as const;
  for (const subject of Object.keys(docs) as (keyof typeof docs)[]) {
    const path = `docs/ifsc/curriculum/${docs[subject]}.md`;
    const raw = addOrigin(path);
    for (const section of raw.split(/^## /m).slice(1)) {
      const header = /^(\S+)\s+[—–-]\s+([^\r\n]+)/.exec(section);
      if (!header || !header[1].startsWith(`${subject}-`)) continue;
      const ids = [...section.matchAll(/^- `([A-Z][A-Z0-9_.]+)`/gm)].map(match => match[1]);
      add(subject, header[1], header[2], ids, path, false);
    }
  }
  const path = "packs/seeds/ifsc-2027.golden.track.v2.json";
  const pack = trackPackV2Schema.parse(JSON.parse(addOrigin(path)));
  for (const subjectModule of pack.track.modules) {
    const subject = subjectModule.subjectCode;
    if (subject !== "MAT" && subject !== "POR" && subject !== "CIE" && subject !== "GH") throw new Error(`Unknown seed subject: ${subject}`);
    for (const lesson of subjectModule.lessons) add(subject, lesson.id, lesson.title, lesson.concepts.map(concept => concept.id), path, true);
  }
  return taxonomySchema.parse({ schemaVersion: 1, sourceScopeVerified: false, origins, existingSourceIds: pack.sources.map(source => source.id),
    lessons: [...lessons.values()].sort((a, b) => a.id.localeCompare(b.id)),
    concepts: [...concepts.values()].sort((a, b) => a.id.localeCompare(b.id)) });
}

const command = process.argv[2];
if (!["refresh", "check"].includes(command)) throw new Error("Usage: pnpm exec tsx vecta-source-library/manage.ts refresh|check");
const taxonomy = buildTaxonomy();
const { pack } = validateLibrary(JSON.parse(read("vecta-source-library/sources.json")), JSON.parse(read("vecta-source-library/media/catalog.json")), taxonomy);
const outputs = new Map<string, string>();
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
outputs.set("taxonomy.json", json(taxonomy));
const escape = (value: string) => value.replace(/[\r\n]/g, " ").replace(/[\\`*_[\]<>]/g, "\\$&");
const records = pack.sources.map(source => ({ source, meta: libraryMetadataSchema.parse(source.content.metadata.library) }));
const index = (title: string, selected: typeof records) => `# ${title}\n\n${selected.length ? selected.map(({ source, meta }) =>
  `- **${source.content.id}** — ${escape(source.content.title)} · ${meta.resourceType} · qualidade ${meta.quality} · ${meta.licenseStatus} · ${meta.status}\n  Tópicos: ${meta.topics.map(escape).join(" / ") || "a revisar"}. Concepts: ${meta.conceptIds.join(", ") || meta.conceptMappingStatus}.`
).join("\n") : "Nenhuma fonte cadastrada. Envie links diretamente ao VECTA Librarian."}\n`;
outputs.set("INDEX.md", `# VECTA Source Library\n\nEstado: WAITING_FOR_LINK. ${records.length} fonte(s) no catálogo.\n\nCatálogo canônico: [sources.json](sources.json). Convenções: [README.md](README.md). Mídia: [catálogo](media/catalog.json).\n\n${subjects.map(subject => `- [${subject}](${subject}/INDEX.md)`).join("\n")}\n- [Pendências](inbox/INDEX.md)\n- [Arquivo](archive/INDEX.md)\n- [Livros](books/INDEX.md)\n- [Instituições](institutions/INDEX.md)\n\nTaxonomia derivada de documentos e seeds existentes; presença de Concept não prova ensino disponível nem correspondência ao edital vigente.\n`);
for (const subject of subjects) {
  outputs.set(`${subject}/INDEX.md`, index(subject, records.filter(record => record.meta.subjects.includes(subject))));
  if (["MAT", "POR", "CIE", "GH"].includes(subject)) outputs.set(`${subject}/taxonomy.json`, json({
    subject, sourceScopeVerified: false, lessons: taxonomy.lessons.filter(lesson => lesson.subject === subject),
    concepts: taxonomy.concepts.filter(concept => concept.subjects.includes(subject))
  }));
}
outputs.set("inbox/INDEX.md", index("Pendências de verificação", records.filter(record => record.meta.status === "INBOX" || record.meta.reviewReasons.length > 0)) +
  (pack.unresolved.length ? `\n${pack.unresolved.map(item => `- ${escape(item.id)}: ${escape(item.message)}`).join("\n")}\n` : ""));
outputs.set("archive/INDEX.md", index("Fontes arquivadas", records.filter(record => record.meta.status === "ARCHIVED")));
outputs.set("books/INDEX.md", index("Livros e materiais didáticos", records.filter(record => ["BOOK", "TEXTBOOK"].includes(record.meta.resourceType))));
outputs.set("institutions/INDEX.md", index("Referências institucionais", records.filter(record => ["OFFICIAL_DOCUMENT", "OFFICIAL_DATASET", "EDUCATIONAL_SITE", "SCIENTIFIC_SOURCE"].includes(record.meta.resourceType))));
for (const [folder, types] of Object.entries({ images: ["IMAGE", "INFOGRAPHIC"], videos: ["VIDEO"], simulations: ["SIMULATION", "INTERACTIVE_TOOL"], maps: ["MAP"] })) {
  outputs.set(`media/${folder}/INDEX.md`, index(folder, records.filter(record => types.includes(record.meta.resourceType))));
}
outputs.set("media/INDEX.md", "# Mídia\n\n[Imagens](images/INDEX.md) · [Vídeos](videos/INDEX.md) · [Simulações](simulations/INDEX.md) · [Mapas](maps/INDEX.md)\n\n[MediaPack do Content Studio](catalog.json). Candidatos referenciam os IDs do catálogo central; nenhum arquivo externo é baixado automaticamente.\n");
for (const [path, content] of outputs) {
  const file = resolve(library, path);
  if (command === "check") {
    if (readFileSync(file, "utf8") !== content) throw new Error(`Stale derived file: ${path}; run refresh`);
  } else {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content, "utf8");
  }
}
console.log(`Library ${command}: ${pack.sources.length} sources; ${taxonomy.concepts.length} Concepts; ${outputs.size} derived files verified.`);
