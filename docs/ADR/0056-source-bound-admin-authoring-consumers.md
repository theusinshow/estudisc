# ADR 0056 — source-bound ADMIN authoring consumers

Date: 2026-10-08. Status: Accepted under continuous authorization.

Extend existing ADMIN/import/review surfaces; reuse the targeted next-lesson-version importer and actual publication services. The server supplies the authenticated author, imported source definition/version/hash and immutable Question reference hashes. The workbench adds blocks to a draft next version while retaining every existing field/block/Activity/Concept/Question. No published version is edited in place, no whole-corpus import or new publication engine.

The existing caderno.lesson.v2 schema already admits text families. Expand the targeted policy's admissible additions to text/note/warning/example/summary/worked-example/concept/code using existing payload schemas, alongside compatible numeric exploration. No schema envelope/DDL/backfill is needed; old numeric packets remain compatible. This increment does not add media, Questions, Activities or inline assessments. Source binding, semantic validation and preview precede import.

Asset/blueprint viewers validate existing metadata contracts and show actual rights/exposure/verification/source-hash caveats. Metadata upload is not independent approval; protected assets are not public reusable assets. Content health reports source/goal/mapping/accessibility gaps without fabricating certification. New context readers and surfaces require ADMIN and FEATURE_CONTENT_HEALTH; original import/review/publication authorization remains.

Test strict source/hash/retention and old packet compatibility, payload families, Student denial and preview/import recovery, published-version immutability and responsive/keyboard behavior. Full gates precede direct release; disabling the feature restores existing views and preserves authored drafts/release history.
