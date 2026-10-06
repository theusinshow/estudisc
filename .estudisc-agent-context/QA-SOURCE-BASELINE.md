# Science QA source baseline

Scope: deterministic source structure/fidelity only; draft integration, no editorial review or publication approval.

Completed all-source script audit; representative block shapes inspected for CIE-04/10/18/22/30/33/38/40. Source remains untouched.

- Counts: 40 lessons, 320 single-choice questions, 240 editorial Concepts, 538 blocks, 55 source records, 66 coverage rows, 13 image requests, 24 deterministic requests, 620 source files hashed.
- All question answer keys resolve uniquely among five options; all question Concept references resolve within their lesson. Source/research/media Concept links resolve. Author lessons/questions and catalog Concepts match approved source packs exactly.
- Ten block types: HOOK 40, LEARNING_GOALS 40, EXPLANATION 120, CALLOUT 160, WORKED_EXAMPLE 40, MEDIA_RECOMMENDATION 21, SUMMARY 40, EXIT_TICKET 40, IMAGE_REQUEST 13, DETERMINISTIC_COMPONENT_REQUEST 24.
- Source defect: all 40 IMPORT-MANIFEST lesson SHA-256 values differ from actual raw approved/pack.json files. Preserve actual source hashes; do not silently claim manifest integrity.
- Source status is APPROVED_CONTENT_PENDING_INTEGRATION; this supplied string is not independent approval. Import remains draft.
- No prerequisite fields exist in approved lesson objects; no prerequisites inferred. Full-package prerequisite-key scan is retained in the JSON baseline.

Reusable script: tools/science-import/qa/source-audit.mjs. Report: tools/science-import/qa/source-baseline.json. Instructions: tools/science-import/qa/README.md.

Commands passed: `node tools/science-import/qa/source-audit.mjs`; `pnpm exec eslint tools/science-import/qa/source-audit.mjs`. First audit exposed an incorrect QA assumption about the question type enum; script corrected to actual MULTIPLE_CHOICE_SINGLE and rerun. No application suites/build/E2E repeated.

NEXT: await integrator pilot artifacts; verify all eight lessons/64 questions via real renderer SSR, fidelity, answer/evidence compatibility, and draft visibility. Root owns final full validation.
