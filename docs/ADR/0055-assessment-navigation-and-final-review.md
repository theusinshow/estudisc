# ADR 0055 — assessment navigation and final review

Date: 2026-10-08. Status: Accepted under continuous authorization.

FEATURE_REAL_EXAM extends the existing AssessmentPanel with question navigation, saved/dirty/flag indicators and final review. Keep mounted question controls behind hidden wrappers, preserving local unsent drafts while navigating. Persist flags/responses only through the existing save endpoint. Finalize is disabled during dirty/saving work; failures keep the draft and retry path. The display timer advances from the provided server timestamp using monotonic elapsed time; server deadlines and exactly-once finalization remain authoritative.

No new evaluator, score, transaction, snapshot, exposure or evidence policy. EXAM never shows tutor/hints/early correctness. Post-finalization Concept counts derive only from actual scored outcomes, deduplicating each Question's Concept IDs; annulled items remain separate and never imply mastery.

Test navigation, keyboard/touch, saved resume, unsent preservation, flag persistence, final review and failure/expiry recovery; retain original engine guards. Full gates precede direct release. Flag off restores the prior presentation; frozen in-flight assessments and history remain readable.
