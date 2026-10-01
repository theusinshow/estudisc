# Curriculum foundation

Extends the existing catalog with official requirement/source mappings, Track-local Concept importance and required/recommended prerequisites. Concepts remain the mastery target. Relationships enforce the same Track in PostgreSQL; semantic validation rejects cycles and cross-subject mappings before mutation.

`DrizzleCurriculumRepository.applyFoundation` validates and inserts atomically. Retrying identical content is idempotent; conflicting historical definitions require a new Track Pack version. The seed uses the existing v1 importer in a transaction and is intentionally partial: four Modules, six percentage Concepts, three prerequisite Concepts and one requirement. Empty lesson skeletons are explicitly marked in preparation.

Coverage is derived. `getCoverage` currently reports mapping and content gaps; it cannot return COVERED/VALIDATED until publication/QA/question readiness exists in later milestones. `sourceScopeVerified` remains false until the full Anexo V is reconciled. A percentage over recorded requirements is not the completeness of the official syllabus.

Fixtures: `packs/seeds/ifsc-2027.foundation.*`. Pack v2 will carry these additions through the normal importer. No seed or migration has been applied to production.
