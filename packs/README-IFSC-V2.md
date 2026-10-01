# IFSC Track Pack v2 Notes

`caderno.track.v2` is an additive capability expansion. The real repository must continue accepting `caderno.track.v1`.

The JSON Schema validates shape. Semantic validation must additionally verify:

- stable IDs are unique in their required scope;
- all mapped Concept IDs exist;
- prerequisite Concept IDs exist;
- prerequisite graph has no invalid cycles;
- Question Concept/source references exist;
- question answer matches type/choices;
- multiple-choice has exactly one correct choice unless a future type explicitly says otherwise;
- official provenance has exam metadata;
- derived provenance points to an existing question;
- lesson exit-ticket IDs exist;
- registered Block/Activity types exist in the runtime registry;
- reserved official content cannot be accidentally imported as general training-ready content.

The minimal example is intentionally incomplete as a curriculum. It exists to validate the v2 contract.
