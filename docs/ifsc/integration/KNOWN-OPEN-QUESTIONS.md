# Known Open Questions

These are implementation/editorial tuning decisions, not architecture blockers.

## Policy tuning

- exact mastery.v2 numeric thresholds;
- exact confidence formula;
- exact retention decay/stability formula;
- exact Planner weight values;
- exact subject-balance band configuration;
- exact review interval extension beyond 30 days.

All must remain deterministic, versioned and testable.

## Curriculum editorial tuning

- whether Science Evolution and Astronomy stay as two Lessons (recommended) or are compacted;
- final count of Lessons/Concepts after requirement mapping;
- exact Concept importance labels after full mapping;
- exact minimum question coverage needed for planner-ready by Concept type.

## Assessment calendar

- exact date of protected 2026.1 benchmark;
- exact date of protected 2026.2 benchmark;
- exact number of generated mini simulations.

These are configuration, not hardcoded architecture.

## Design token tuning

- final subject accent hex values;
- final learning-card radius/touch sizes after accessibility/visual review.

The existing semantic state tokens remain authoritative.

## Content/source operations

- approved external factual references for each SourcePack;
- asset licensing/provenance for non-official generated illustrations;
- human-review sampling percentage after the first content batch.

None of these questions justifies delaying the first vertical slice.
