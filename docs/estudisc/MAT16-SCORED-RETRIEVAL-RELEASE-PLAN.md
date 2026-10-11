# MAT-16 scored circle retrieval — release plan

Status: prepared locally; not imported, published, answered, deployed or
claimed live.

## Bounded content

Use `buildMat16CircleRetrievalPacket` only with a freshly read, authenticated
published MAT-16 v4 authoring context. It rejects any other identity, version,
publication state or missing retained circle Concepts. The packet creates three
original generated training Questions, each version 1 and draft:

- circumference from radius 5 cm, with π ≈ 3,14;
- radius from circumference 62,8 cm, with π ≈ 3,14;
- area from radius 3 cm, with π ≈ 3,14.

They use the existing numeric Question evaluator and `question` Activity route.
They are not official-exam items, do not contain assets, are not reserved for
assessment, and use `generated` provenance with run ID
`mat16-circle-retrieval-v1`. The questions are original wording/formula
applications; they copy no OpenStax exercise, diagram or text. MAT-16's
retained source, rights and non-certification mapping caveats remain visible.

## Real release gate

1. Release the validated v3 contract code through the normal protected code
   path; do not use a v2 or Track-import workaround.
2. Read a fresh authenticated MAT-16 v4 context and build the packet with a
   unique receipt ID. Confirm all retained references/hashes and preview it at
   `/api/import/lesson/preview`.
3. Import exactly that packet once through `/api/import/lesson`, then use the
   existing authenticated Admin Direct content-QA endpoint with the actual
   authorization reason. This publishes the new Question releases and MAT-16
   v5 as one existing bundle; do not invent editorial reviews.
4. Audit v2–v4 rows, all original refs, frozen-session composition, Attempts,
   ConceptEvidence and StudyEvents before/after. Confirm current reads are v5,
   explicit/frozen reads are unchanged, and exercise keyboard/mobile response
   plus a real submitted Question only if separately authorized for a test
   learner state.

Focused engineering validation and local lint/packs are complete. The
originating session's complete `pnpm typecheck` passed exit 0 (private local
evidence: `.local/typecheck-support-current.log`). Native MXC cannot create
the deliberate junction used by the existing linked-path security test; retain
that test unchanged and use protected frozen-lockfile CI on its provisioned
Linux runner for the complete gate. No production content action is implied by
this plan.
