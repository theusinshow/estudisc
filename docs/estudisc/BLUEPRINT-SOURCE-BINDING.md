# Exact ADMIN blueprint source matching

Released 2026-10-08: protected PR #16/eight checks/main 714622c; production READY/commit/alias verified. Actual CIE-03 v2 original sidecar metadata returned sourceMatches=true, UNREVIEWED and missing goal; a stale version returned false with the same truthful review/goal state. No lesson import/publication. [Actual receipt](BLUEPRINT-SOURCE-BINDING-RELEASE.json).

The blueprint pipeline hashes `{identity, subjectCode, lesson}`. The targeted import uses the raw `lesson` hash. These intentional contracts are different; the previous metadata viewer compared them directly, so even a valid exact-source proposal could not match.

The existing SQL/memory source reader now builds a server-only binding from actual imported track/version/module subject/lesson data. The metadata endpoint checks exact track/version/lesson/subject plus the pipeline wrapper hash. The original authoring-context response and raw targeted baseHash remain unchanged. A stale, foreign or unsupported source remains unconfirmed. No Pack/blueprint schema, source-field change, approval, publication or canonical learning-state mutation.

Tests use an actual `createLessonBlueprint` output rather than a fabricated raw lesson hash; exact positive and foreign track/version/subject/raw-hash negatives pass. Migrated SQL and memory readers preserve the original wire shape; source matching leaves proposal reviewState UNREVIEWED and missing original goals intact. Full local 441 PASS/three optional real-PG SKIP, focused seventeen PASS, lint/typecheck/build/packs PASS. Actual desktop/mobile metadata source/stale/rights flows four PASS plus original workbench two PASS; default serial browser 58 PASS/thirty-six gated SKIP. Direct protected release is next; no production success is claimed yet.

This correction enables factual evaluation of the remaining content-goal exceptions. Source/hash correspondence is not pedagogical, rights or official-mapping approval.
