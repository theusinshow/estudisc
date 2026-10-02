# ADR 0033: Release authorship follows content provenance

Status: Accepted (user request, 2026-10-02)

## Context

Content releases record an author, and the QA policy rejects a review whose reviewer is that author (`publicationIssues`, `self_review_*`). Imports registered every release with the importing account as author. In practice the owner imports packs whose lessons and questions were written by an AI authoring run, or by IFSC for official items. Recording the importer as author has two problems:

- It misstates who wrote the content.
- It makes the only human reviewer, the owner who imported the pack, ineligible to review anything, so no release can ever be published.

## Decision

The release author is derived from the content's own provenance. The importer is used only when the content declares no author.

- Question with `provenance.type = "generated"`: `ai:<generationRunId>`.
- Question with `provenance.type = "official_exam"`: `exam:<examId>`.
- Lesson whose sources include an `ai_generated` source with `metadata.authorRunId`: `ai:<authorRunId>`.
- Everything else (`human_created`, `derived`, curriculum scope, lessons without an AI source): the importing account, as before.

The independence rule is unchanged: a reviewer can never review a release attributed to them. The owner can review AI-authored drafts because a human reviewing AI work is a real independent review. AI agents have no reviewer identity and still cannot approve anything; nothing is approved automatically.

## Consequences

- A pack the owner writes and imports as `human_created` still needs a different reviewer.
- Existing releases keep their recorded author, because `register` is idempotent per version. Production had no releases when this changed.
- The per-lesson review screen records the owner's four layer reviews on the lesson release and on each of its questions, as separate append-only rows that share the same rationale.

## Rejected alternatives

- Allowing self-review for single-admin installations: it removes the independence guarantee for human-authored content.
- A second fake reviewer account: it fabricates independence.
