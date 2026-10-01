# Shared versioned Questions

Questions have stable identity, immutable version/content hashes, Concept links, choices, sources, provenance and exposure policy. `DrizzleQuestionRepository` is the persistent catalog adapter. Re-importing a version with changed content rejects the whole Pack transaction. The existing memory UI harness preserves full v2 manifests; it is disposable and does not replace migrated PostgreSQL validation.

Evaluators support multiple choice, numeric, ordering, classification and matching. Empty numeric input is invalid; comma and dot decimal forms work. Annulled items always have zero score and no evidence eligibility. Exposure selection fails closed for drafts, retired/annulled items and reserved material without the matching authorized assessment or configured release. Authorization must be derived on the server, never accepted from student input.

Current supported content is plain text. Rich-content objects are rejected rather than silently rendered as executable markup. Registry capability validation rejects interactions until their renderers are implemented. Pack v1 remains unchanged.
