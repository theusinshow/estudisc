# ADR 0036 - Direct administrative lesson publication

Status: Accepted (explicit user request, 2026-10-05)

## Context

The owner requests programmatic publication without the four-layer review. The imported forty-lesson Science snapshot has no objectives or exit tickets, so the existing editorial completeness gate also prevents its publication. An administrative decision must not masquerade as independent factual or pedagogical review.

## Decision

Add `ContentQaRepository.publishLessonsDirect` and the authenticated `publish_lessons_direct` action on the existing ADMIN API. This explicit operation supersedes ADR 0025's mandatory editorial gate; normal reviewed publication remains unchanged.

- Require an authenticated ADMIN, a reason, and one explicit version for each of at most forty unique lesson IDs.
- Publish the exact imported lesson versions and their referenced shared Question versions in one transaction for the entire batch. Questions publish before lessons. Retry is idempotent.
- Dispense with editorial reviews, independence checks, required objectives/exit tickets and the minimum two-question training pool for each Concept. These omissions remain visible in the original content.
- Retain schema/import validation, registered versions, retired-version rejection, source-asset checks and resolution of exit-ticket references when present. Keep reservation/exposure rules and annulled status unchanged.
- Record each newly published release in `content_publication_events`, with the real authenticated ADMIN identity, reason, mode and timestamp. Never create fabricated QA reviews or change content authorship.
- Preserve published content bytes/hashes, historical versions, Attempts, study events and ConceptEvidence. No changes to mastery, planner, retention, scoring or Pack schemas.

## Consequences

ADMIN assumes responsibility for material released without editorial certification. Direct publication is distinguishable from review-based publication and cannot be invoked by a STUDENT or an anonymous request. The content need not claim completed factual, pedagogical or IFSC-alignment verification.

An additive migration creates the audit table. Deployment and production migration remain separate authorization boundaries. Existing review/retirement workflows remain available; retirement still requires a new version before republication.

## Rejected alternatives

- Fake four-layer approvals: this invents review evidence.
- Remove the review gate globally: this changes the existing workflow unnecessarily.
- Anonymous endpoints or an ADMIN identity supplied in request JSON: this bypasses authentication.
- Update only lesson status: this leaves its shared Questions unavailable and can partially publish a broken bundle.
