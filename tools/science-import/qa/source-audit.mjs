import { createHash } from 'node:crypto';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Structural audit only. Does not establish scientific/editorial approval.
const source = path.resolve(process.argv[2] ?? 'packs/drafts/ifsc-2027-science/source');
const output = path.resolve(process.argv[3] ?? 'tools/science-import/qa/source-baseline.json');
const sha = (value) => createHash('sha256').update(value).digest('hex');
const canonical = (value) => sha(JSON.stringify(value));
const read = async (name) => JSON.parse(await readFile(path.join(source, name), 'utf8'));
const issues = [];
const issue = (code, target, detail) => issues.push({ code, target, detail });
const check = (condition, code, target, detail) => { if (!condition) issue(code, target, detail); };
const manifest = await read('IMPORT-MANIFEST.json');
const curriculum = await read('SCIENCE-CURRICULUM-MAP.json');
const library = await read('SCIENCE-SOURCE-LIBRARY.json');
const images = await read('MEDIA-PRODUCTION/ANTIGRAVITY-QUEUE.json');
const diagrams = await read('MEDIA-PRODUCTION/DETERMINISTIC-ASSET-QUEUE.json');
const sourceIds = new Set(library.sources.map((s) => s.id));
const allIds = new Set();
const blockTypes = {};
const lessons = [];
const fileHashes = {};
const prerequisiteFields = [];
function findPrerequisites(value, file, location = '') {
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value)) {
    const field = location ? `${location}.${key}` : key;
    if (/prereq/i.test(key)) prerequisiteFields.push({ file, field, value: nested });
    findPrerequisites(nested, file, field);
  }
}
async function hashTree(relative = '') {
  for (const entry of (await readdir(path.join(source, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) await hashTree(name);
    else {
      const bytes = await readFile(path.join(source, name));
      fileHashes[name] = sha(bytes);
      if (name.endsWith('.json')) findPrerequisites(JSON.parse(bytes.toString('utf8')), name);
    }
  }
}
await hashTree();
function unique(id, target) {
  check(typeof id === 'string' && id.length > 0 && !allIds.has(id), 'INVALID_OR_DUPLICATE_ID', target, id);
  allIds.add(id);
}
function refs(values, valid, target, code) {
  for (const value of values ?? []) check(valid.has(value), code, target, value);
}
for (let index = 1; index <= 40; index++) {
  const id = `CIE-${String(index).padStart(2, '0')}`;
  const base = `workspace/${id}`;
  const pack = await read(`${base}/approved/pack.json`);
  const author = await read(`${base}/author/lesson.json`);
  const questions = await read(`${base}/author/questions.json`);
  const catalog = await read(`${base}/catalog.json`);
  const research = await read(`${base}/research/source-pack.json`);
  const media = await read(`${base}/research/media-pack.json`);
  const lesson = pack.lesson;
  unique(lesson.lessonId, id);
  check(lesson.lessonId === id, 'LESSON_ID_MISMATCH', id, lesson.lessonId);
  check(canonical(author) === canonical(lesson), 'AUTHOR_PACK_LESSON_DRIFT', id);
  check(canonical(questions) === canonical(pack.questions), 'AUTHOR_PACK_QUESTION_DRIFT', id);
  check(canonical(catalog.concepts) === canonical(lesson.concepts), 'CATALOG_CONCEPT_DRIFT', id);
  check(lesson.concepts.length === 6 && pack.questions.length === 8, 'LESSON_COUNT_MISMATCH', id);
  const concepts = new Set(lesson.concepts.map((c) => c.id));
  for (const concept of lesson.concepts) {
    unique(concept.id, id);
    check(Boolean(concept.name?.trim() && concept.masteryTarget?.trim()), 'EMPTY_CONCEPT', concept.id);
  }
  const blocks = new Set(lesson.blocks.map((b) => b.id));
  for (const block of lesson.blocks) {
    unique(block.id, id);
    blockTypes[block.type] = (blockTypes[block.type] ?? 0) + 1;
    for (const [key, value] of Object.entries(block)) {
      if (typeof value === 'string') check(!value.includes('\uFFFD'), 'REPLACEMENT_CHARACTER', `${block.id}.${key}`);
    }
  }
  for (const question of pack.questions) {
    unique(question.id, id);
    const keys = question.options.map((option) => option.key);
    check(keys.length === 5 && new Set(keys).size === keys.length, 'INVALID_OPTIONS', question.id);
    check(keys.filter((key) => key === question.correctOption).length === 1, 'INVALID_CORRECT_OPTION', question.id, question.correctOption);
    check(question.type === 'MULTIPLE_CHOICE_SINGLE', 'QUESTION_TYPE', question.id, question.type);
    check(Boolean(question.stem?.trim() && question.explanation?.trim()), 'EMPTY_QUESTION', question.id);
    check(question.conceptIds?.length > 0, 'NO_QUESTION_CONCEPTS', question.id);
    refs(question.conceptIds, concepts, question.id, 'UNKNOWN_QUESTION_CONCEPT');
  }
  refs(lesson.sourceRefs, sourceIds, id, 'UNKNOWN_SOURCE_REF');
  refs([...research.primarySources, ...research.factCheckSources, ...research.supportSources, ...research.interactiveSources], sourceIds, id, 'UNKNOWN_RESEARCH_SOURCE_REF');
  const mediaIds = new Set(media.mediaCandidates.map((m) => m.id));
  refs(lesson.mediaRefs, mediaIds, id, 'UNKNOWN_MEDIA_REF');
  check(media.coreLessonDependsOnExternalMedia === false, 'EXTERNAL_CORE_DEPENDENCY', id);
  const imageRequests = images.requests.filter((r) => r.lessonId === id);
  refs(lesson.imageRequestRefs, new Set(imageRequests.map((r) => r.id)), id, 'UNKNOWN_IMAGE_REQUEST');
  for (const request of imageRequests) {
    check(blocks.has(request.blockId), 'UNKNOWN_IMAGE_BLOCK', request.id, request.blockId);
    refs(request.conceptIds, concepts, request.id, 'UNKNOWN_MEDIA_CONCEPT');
    refs(request.sourceRefs, sourceIds, request.id, 'UNKNOWN_MEDIA_SOURCE');
  }
  for (const request of diagrams.requests.filter((r) => r.lessonId === id)) {
    refs(request.conceptIds, concepts, request.id, 'UNKNOWN_MEDIA_CONCEPT');
    refs(request.sourceRefs, sourceIds, request.id, 'UNKNOWN_MEDIA_SOURCE');
  }
  const entry = manifest.lessons.find((l) => l.lessonId === id);
  check(Boolean(entry), 'MISSING_MANIFEST_ENTRY', id);
  if (entry) check(entry.hash === fileHashes[entry.path], 'MANIFEST_HASH_MISMATCH', id, { declared: entry.hash, actual: fileHashes[entry.path] });
  lessons.push({ id, status: lesson.status, titleHash: canonical(lesson.title), lessonHash: canonical(lesson), questionsHash: canonical(pack.questions), blockCount: lesson.blocks.length, blockIds: [...blocks], conceptIds: [...concepts], conceptsHash: canonical(lesson.concepts), prereqFields: Object.keys(lesson).filter((k) => /prereq/i.test(k)), sourceRefs: lesson.sourceRefs, mediaRefs: lesson.mediaRefs, blockShapes: lesson.blocks.map((b) => ({ id: b.id, type: b.type, fields: Object.keys(b), hash: canonical(b) })), questions: pack.questions.map((q) => ({ id: q.id, correctOption: q.correctOption, conceptIds: q.conceptIds, provenance: q.provenance, hash: canonical(q), stemHash: canonical(q.stem), optionsHash: canonical(q.options), explanationHash: canonical(q.explanation) })) });
}
check(manifest.lessons.length === 40 && curriculum.lessons.length === 40, 'ROOT_LESSON_COUNT');
check(library.sources.length === 55 && sourceIds.size === 55, 'SOURCE_LIBRARY_COUNT');
check(images.requests.length === 13 && images.count === 13 && diagrams.requests.length === 24 && diagrams.count === 24, 'MEDIA_QUEUE_COUNT');
for (const rootFile of manifest.rootFiles) check(Boolean(fileHashes[rootFile]), 'MISSING_ROOT_FILE', rootFile);
const lessonIds = new Set(lessons.map((l) => l.id));
for (const row of curriculum.officialCoverage) refs(row.lessonIds, lessonIds, row.item, 'UNKNOWN_COVERAGE_LESSON');
for (const entry of library.sources) {
  refs(entry.lessonIds, lessonIds, entry.id, 'UNKNOWN_SOURCE_LESSON');
  check(Boolean(entry.id && entry.title && entry.type && entry.licenseStatus), 'MISSING_SOURCE_METADATA', entry.id);
  if (entry.url) { try { new URL(entry.url); } catch { issue('INVALID_SOURCE_URL', entry.id); } }
}
const counts = { lessons: lessons.length, questions: lessons.reduce((n, l) => n + l.questions.length, 0), concepts: lessons.reduce((n, l) => n + l.conceptIds.length, 0), blocks: lessons.reduce((n, l) => n + l.blockCount, 0), sources: library.sources.length, images: images.requests.length, diagrams: diagrams.requests.length, coverage: curriculum.officialCoverage.length, files: Object.keys(fileHashes).length };
const report = { scope: 'Deterministic source structure and fidelity baseline; no editorial approval, research, or rewriting.', source: path.relative(process.cwd(), source).replaceAll('\\', '/'), counts, blockTypes, prerequisites: 'No prerequisite fields in editorial approved lessons; none inferred.', sourceMetadata: library.sources.map(({ id, type, quality, licenseStatus, url, localRef, lessonIds: ids }) => ({ id, type, quality, licenseStatus, url, localRef, lessonIds: ids })), mediaQueues: { images: images.requests.map(({ id, lessonId, blockId, status, sourceRefs, conceptIds }) => ({ id, lessonId, blockId, status, sourceRefs, conceptIds })), diagrams: diagrams.requests.map(({ id, lessonId, type, status, sourceRefs, conceptIds }) => ({ id, lessonId, type, status, sourceRefs, conceptIds })) }, lessons, fileHashes, issues };
await mkdir(path.dirname(output), { recursive: true });
report.prerequisiteFields = prerequisiteFields;
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ counts, blockTypes, issueCounts: issues.reduce((result, item) => ({ ...result, [item.code]: (result[item.code] ?? 0) + 1 }), {}), report: path.relative(process.cwd(), output) }, null, 2));
// A source defect remains visible without rejecting preservation of that source.
if (issues.some((item) => item.code !== 'MANIFEST_HASH_MISMATCH')) process.exitCode = 1;
