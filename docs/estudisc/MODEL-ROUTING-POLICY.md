# Estudisc — model routing and execution policy

Source: explicit user instruction, 2026-10-06. Applies to this evolution plan; preserves existing repository authorization and content-review boundaries.

Default: **Luna Max**. Escalate to **Terra** for a concrete domain, architecture, security, persisted-data or consistency decision. Use **Sol High** exceptionally for unresolved difficult diagnosis, critical adversarial review, irreversibility or unresolved architectural tradeoffs. A long task, many files/tests, large context or an initial failed attempt do not justify escalation.

The active session cannot change its own model. Do not claim to have used Luna/Terra/Sol without actual selection. Terra is the user's routing label; availability must be checked in the execution environment when a handoff is needed. Do not silently substitute another model. No additional agents by default; reuse existing workers only when their involvement is actually authorized.

| Work | Default / escalation trigger |
|---|---|
| Read repo/specs, gap analysis, implementation plan, inventories, documentation | Luna Max |
| Design tokens/primitives, specified mobile UI, accessibility, CSS, motion, component refactoring | Luna Max |
| Today, Planner, Learn, Review, Progress, Focus, Summary, Admin and Exam UI | Luna Max; Terra if domain rules change |
| shadcn, dnd-kit, React Flow or MapLibre integration | Luna Max after contracts; Terra for graph/domain/security decisions |
| Schemas/types, tests/fixtures, renames, additive migrations with no existing-data transformation | Luna Max |
| Blueprint extraction, compact summaries, deterministic classification/clustering, hashing/reports | Luna Max; Terra only for ambiguous learning goals, prerequisites or pedagogy |
| Approved-template content enrichment using existing components | Luna Max; Terra for new complex pedagogical decisions |
| Adaptive composition, recommendation ordering, prerequisite traversal/unlocks | Terra: weights, priorities and interactions affect what the student studies |
| Mastery, evidence weighting, retention/confidence/decay, spaced repetition | Terra: versioned deterministic pedagogical semantics |
| Mistake patterns and targeted practice selection | Terra for inference and evidence impact; Luna for storage/UI under approved contracts |
| Auth, authorization, sessions/cookies, CSP, admin security | Terra; Luna only for presentation |
| Existing-data migration/backfill/cardinality, complex transactions/locking/cache coherence/query performance | Terra; Sol High review if high risk or irreversible |
| AI provider abstraction, context, fallback/cache/rate limits/cost routing, output boundary | Terra architecture; Luna implementation under its documented contract |
| Intermittent cross-system bug, corruption, unexplained CI divergence or Luna → Terra failure without diagnosis | Sol High when the difficulty is evidenced |
| Critical session/mastery/review/publication implementation review | Sol High adversarial review when risk warrants; find defects, do not rewrite unnecessarily |

Risk guide: LOW → Luna; MEDIUM → Luna unless relevant ambiguity appears; HIGH → Terra; CRITICAL → Terra plus Sol High review before execution when needed. Reversibility raises the required level: CSS → Luna; additive field → Luna; new algorithm → Terra; transformation of mastery history → Terra plus review; irreversible production migration → Sol High review and explicit human authorization.

Execution discipline:

1. Read the architecture entry point, gap analysis and current phase once; open specialist documents only for that phase.
2. Work in one small coherent increment. Run focused checks, repair failures, record results and checkpoint locally when safe. Preserve final acceptance gates.
3. Never send all 132 full lessons to a strong model. Extract locally → summarize → deterministic rules → cluster → classify → review confidence → escalate exceptions only.
4. Blueprints keep source hashes and pipeline versions. Hash equality skips work only when policy/version and relevant dependencies still match. Prior QA requires actual artifact paths/hashes; do not infer approval.
5. A confidence cutoff such as 0.70 is a proposal to validate, not a proven measure of pedagogical correctness. Low confidence and complex exceptions route to Terra; Sol High remains exceptional.
6. AI summaries and classifications do not replace independent editorial review or human publication authorization.

At the first safe point where escalation is required, stop dependent implementation and write `MODEL ESCALATION REQUIRED`. Save a compact handoff under `docs/estudisc/handoffs/` containing: current task; precise risk/ambiguity; confirmed facts; current architecture; relevant files and hashes; changes already made; exact green/red test commands; open questions; constraints; recommended model; exact next prompt. Do not force the next model to rediscover the whole project.

Suggested handoff prompt:

> Use [Terra or Sol High] for the specific decision in this handoff. Read PRODUCT_ARCHITECTURE.md, the current phase in IMPLEMENTATION-PLAN.md and the listed files only. Preserve existing engines, immutable published versions and append-only history. Resolve the stated ambiguity with a versioned deterministic contract and meaningful tests; return routine implementation to Luna Max. Do not perform external or production writes.

The phase-level `MODEL ROUTING PLAN` is in [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md). No escalation is required to complete this documentation audit.
