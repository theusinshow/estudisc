# ADR 0050 — source-bound linear enrichment and baseline input

Date: 2026-10-07. Status: Accepted for implementation under standing social release authorization. Extends ADRs 0044/0047/0048/0049.

## Decision

Reuse the existing numeric-explorer linear schema/renderer and bounded slope × input + intercept model. Recipe schemaVersion 1 gains a strict additive parameter union: old percentage objects retain their meaning; linear objects explicitly declare mode and satisfy existing range/step/label/explanation constraints. No Pack schema, new model language, formula execution, evaluator, registry, mastery or persistence contract changes. JSON Schema export remains supported; runtime semantic refinements stay authoritative.

Linear exploration gets a native labelled text input as baseline, matching percentage exploration. FEATURE_INTERACTIVE_LESSONS continues to gate its range slider and persisted interaction/resume. With enhanced=false, linear input uses only local React state and never forwards an interaction target to the resume hook, even if supplied by its parent. Initial outputs/source text remain readable. No migration, flag change, backfill or real-secret access is needed. Enhanced behavior retains existing owned/versioned write boundaries.

Enabling the entire interactive feature would activate production resume paths whose table rollout is separate. Static-only examples would not provide exploration. Baseline local input is the smallest reversible extension; code rollback restores initial-output fallback and historical published versions remain available.

## Content and compatibility

Full-source rendering exposed V2 text-family blocks whose valid envelope type is absent from the payload, including MAT-06 and the existing prediction fixture. The existing renderer supplies that missing type only in a read projection for its known text/code/Concept family, matching the figure fallback pattern. Explicit invalid types/content still fail validation; canonical stored payloads and hashes are never changed. No general coercion or extra renderer is introduced.

Keep exact source identity/lesson/block/quote hashes, authored objective/Concept, blueprint recommendation, next version and immutable shared Question references. Check initial output against the complete authored example; explain what stays constant. New recipes cover only direct constant-rate MAT-05/MAT-06 examples, with no inverse model, guessed goal or pedagogical certification. Source/rights/mapping caveats and UNREVIEWED metadata remain truthful. Actual Admin Direct records supply actor/reason; tests/recipes do not certify approval.

Validate old percentage recipes, strict linear failures, expected output, complete preservation, independent inputs, comma decimals, errors, keyboard/mobile focus and no-Attempt/evidence boundaries. Complete protected code release before activating versions. Original lesson/Question records are never rewritten.
