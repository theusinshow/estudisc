# Existing assessment navigation and final review

[ADR 0055](../ADR/0055-assessment-navigation-and-final-review.md) extends the existing AssessmentPanel behind FEATURE_REAL_EXAM. Numbered navigation retains mounted hidden Question controls and unsent drafts. Saved/dirty/saving/review flags use the existing response API; final review blocks submission while changes or saves are pending and preserves retry/expiry recovery.

The display clock advances from the server timestamp with monotonic elapsed time. Existing server deadline, frozen snapshots, owner checks, exactly-once evaluator, reserved exposure and evidence rules remain authoritative. EXAM shows no tutor/hints/early correctness. Post-finalization Concept counts use actual scored outcomes and distinct Concept IDs, with annulled items separate; they do not infer mastery.

Local acceptance: actual 28-Question EXAM desktop/mobile navigation/save/flag/reload/review/finalize/result loop two PASS; clock-skew/failed-save recovery and original evaluator/factual counts four PASS. Full tests 420 PASS/three optional real-PG SKIP; full serial default browser 58 PASS/twenty-eight gated SKIP; five widths/bounded visual/detector checks passed. Lint/typecheck/build/packs PASS. Protected deployment remains pending. No production assessment was created or finalized for testing.
