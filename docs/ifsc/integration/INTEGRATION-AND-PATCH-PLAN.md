# KNOW/OS Core Integration and Patch Plan

Status: **Accepted**

## Principle

Patch the existing KNOW/OS source-of-truth documents in place. Do not create a competing architecture.

## Preserve

Preserve the historical and technical decisions in:

- `AUTONOMY.md`;
- `docs/00-VISION.md`;
- `docs/07-TECHNICAL-ARCHITECTURE.md`;
- `docs/12-PROGRAMMING-LAB.md`;
- Pack/import/export history;
- runtime-isolation decisions;
- Vercel/Neon/Auth.js production decisions;
- append-only Attempt/ConceptEvidence history.

## Patch matrix

| Existing source | Required change |
|---|---|
| `AGENTS.md` | Add IFSC guardrails, mobile-first learning rules and official-exam reservation rule. |
| `README.md` | Mention IFSC expansion and private Admin/Student profiles. |
| `docs/01-PRODUCT.md` | Private multi-profile model; add EXAM mode while preserving BUILD for programming. |
| `docs/02-SCOPE.md` | Add curriculum mapping, Question Bank, Planner, Study Sessions, Assessment Engine, QA and optional tutor. |
| `docs/03-INFORMATION-ARCHITECTURE.md` | Mobile student nav: Today, Learn, Progress, More; Admin shell separate. |
| `docs/04-UX-FLOWS.md` | Add canonical Study Session flow. |
| `docs/05-DOMAIN-MODEL.md` | Add CurriculumRequirement, ConceptPrerequisite, Question, StudyPlan, StudySession, Assessment, QAReview, OwnerIdentity. |
| `docs/06-DATA-MODEL.md` | Add relational structures while preserving append-only evidence. |
| `docs/08-LEARNING-ENGINE.md` | Active recall, scaffolding, interleaving, remediation, exit tickets, Study Sessions. |
| `docs/09-ACTIVITY-ENGINE.md` | Add numeric, ordering, classification, matching, text-highlight and guided-step activities. |
| `docs/10-MASTERY-AND-REVIEW.md` | Preserve v1; add mastery.v2/review.v2 contract. |
| `docs/11-PACK-SPEC.md` | Preserve v1 and add compatible `caderno.track.v2`. |
| `docs/15-TESTING-STRATEGY.md` | Add IFSC invariants and Golden Lesson regression fixtures. |
| `docs/16-SECURITY-ARCHITECTURE.md` | Admin/Student isolation, AI minimization, publishing authorization, reserved-question boundary. |
| `docs/17-ROADMAP.md` | Preserve V1 history; append IFSC milestone series. |
| `docs/18-OBSERVABILITY.md` | Planner/assessment/generation/QA metrics without unnecessary raw student data. |
| `docs/20-ACCEPTANCE-CRITERIA.md` | Reference IFSC acceptance spec; add mobile-first criteria. |
| `docs/21-REPOSITORY-STRUCTURE.md` | Add curriculum, questions, study-sessions, planner, assessments, content-qa, tutor. |
| `docs/22-API-CONVENTIONS.md` | Idempotency for Attempt submission and assessment finalization; transactional evidence updates. |
| `docs/23-ERROR-HANDLING.md` | Separate application/runtime errors from pedagogical learning-error taxonomy. |
| `docs/24-DATA-RETENTION-AND-PRIVACY.md` | Private student profile, minimum data, AI minimization. |
| `design-system/*` | Apply Design System v3 delta from `design-system-v3/`. |

## ADR treatment

- ADR 0008 becomes `Superseded by ADR 0026`.
- ADR 0015 remains valid for Vercel, Neon, Auth.js and Google OAuth; ADR 0026 refines identity-to-owner mapping.
- Do not erase historical ADR text.

## Implementation constraint

IFSC must extend existing `src/features/lessons`, `activities`, `mastery`, `review`, `recommendations`, `generation`, `import` and existing repositories. Parallel replacements require a new ADR and concrete evidence.
