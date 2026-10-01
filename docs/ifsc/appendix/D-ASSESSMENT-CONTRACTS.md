# Appendix D — Assessment Contracts

Status: **Implementation contract**

## Assessment kind behavior

| Kind | Adaptive selection | Timer | Hints/Tutor | Immediate feedback | Evidence |
|---|---:|---:|---:|---:|---:|
| Broad Diagnostic | fixed/broad | optional | no | after finish | yes |
| Targeted Diagnostic | yes | optional | no | after item or finish by policy | yes |
| Mini Simulation | fixed/generated | optional | no | after finish | yes |
| Subject Simulation | fixed/generated | configurable | no | after finish | yes |
| Full Simulation | frozen | up to 4h | no | after finish | yes |
| Official Exam | fixed official | edition rules | no | after finish | yes if valid item |

## Instance snapshot

Freeze at start:

- template version;
- question version IDs;
- order;
- option-order randomization seed/result if used;
- allowed duration;
- scoring policy;
- feedback policy.

## Autosave

Assessment responses are autosaved. Loss of network/UI should preserve recoverable work where feasible.

## Finalization transaction

Idempotency key required.

Transaction conceptually:

1. verify instance open and ownership;
2. freeze final response state;
3. score valid items;
4. append Attempts;
5. append ConceptEvidence;
6. update review/mastery projections as policy defines;
7. mark instance finalized;
8. emit StudyEvents;
9. return result.

A retry of the same finalization must not duplicate Attempts/evidence.

## Official annulled item

Stored response may exist for historical fidelity, but score contribution and ConceptEvidence are zero/none.

## Full simulation result

At minimum:

- total correct/valid items;
- per area correct/valid items;
- Concepts needing review;
- error categories;
- time summary where reliable;
- next-plan consequences.
