# Compact runtime context

Read [CONTENT-CONTRACT.md](../CONTENT-CONTRACT.md) for artifact shapes and `pnpm estudisc-content schemas` for exact JSON Schemas. Read this job's pinned `catalog.json`, not the entire repository.

Lesson is the existing Pack v2 nested Lesson object. Questions reuse the shared production Question schema. Author provenance lives in `lesson-architecture.json`; do not add arbitrary Lesson fields. Runtime content stays draft. Required exit ticket is `exitTicketQuestionIds`, not a new block.

Supported blocks: text, concept, note, warning, code, example, prediction, summary, worked-example, numeric-explorer, guided-steps, text-highlight, classification, ordering, timeline, atom-only diagram, matching, figure. Pack enum placeholders are not renderer support. Missing behavior becomes an unsupported-component request. Videos/books are supplemental metadata, not blocks.

Use exact canonical Concept/requirement IDs. Questions need valid primary Concept/answer/source/provenance. Generated and official identities must remain distinct. Runtime source types: official_curriculum, official_exam, reference, human_created, ai_generated.

CLI state/claims/approved files belong to coordination tooling. Researcher owns research, Author owns author, Reviewer owns review. Claim first; complete with the same owner. Review uses a distinct owner and exact claim hashes. Do not edit state or impersonate human approval.
