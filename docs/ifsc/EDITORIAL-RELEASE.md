# Estudisc editorial release and optional tutor

Imports register immutable content versions as draft in the existing transaction. A package label is not permission to publish. The current 132 lessons and 1,144 subject Questions are already live; do not repeat their imports or publication. See [production evidence](../all-subjects-live-20261006.md).

## Editorial Reviewed

Four real layers are required: `STRUCTURAL`, `FACTUAL`, `PEDAGOGICAL`, `IFSC_ALIGNMENT`. Reviews are append-only and independent of the registered author. HIGH/CRITICAL findings block publication; MEDIUM requires an explicit override rationale. Structural checks include assets, objectives, exit ticket and published training coverage. The per-lesson workflow records the reviewer's actual rationale for the lesson and its Questions and publishes atomically. No template text is an approval.

`review`, `review_lesson`, `review_lessons` and `publish` use this path. New publication events record `editorial_reviewed`, the authenticated publisher and actual publication time. Historical reviewed releases can be identified from actual four-layer reviews, but absent final actor/time remain unknown.

## Admin Direct

`publish_lessons_direct` is a separate official path. It requires an authenticated ADMIN, a reason of 20–3,000 characters and exact lesson versions. The operation locks releases in a stable order and publishes the selected lessons and their Questions in one transaction. It rejects missing or retired versions, preserves content hashes, binds lesson metadata to the actual release, and records an `admin_direct` audit event with actor, reason and time. An unchanged published version remains idempotent.

This path does not create, imply or fabricate independent reviews. Admin UI shows the publication mode, the known actor/time, reason and whether independent QA is actually recorded. Published status alone never certifies editorial approval, official alignment, rights or planner readiness.

## Existing contracts

Question versions and published lesson content remain immutable. Retire records withdrawal; correcting content requires a new version. Shared bank Questions keep their own provenance. Imported author identity stays stable across unchanged reimports. Draft registration, review and publication reuse the existing repositories; no parallel release system exists.

## Optional generation and tutor

`/api/admin/content-generation` compiles/validates/imports draft content with the exact GenerationJob provenance. It never auto-publishes. Manual and server-provider flows use shared Zod response contracts.

The contextual tutor reuses the existing provider gateway and is disabled in EXAM mode. Assistance exposure is recorded conservatively. AI does not own canonical content, mastery, retention, planner policy or official scores. No provider key or generated image is required to study.
