# Estudisc IFSC — Architecture Freeze v1

Status: **Frozen for implementation**

The following decisions are no longer discovery questions for the initial IFSC implementation:

- IFSC extends the existing Estudisc core.
- Modular monolith remains.
- PostgreSQL + Drizzle remains.
- Versioned Packs remain.
- `Concept` is the atomic mastery target.
- No parallel `Skill` mastery aggregate.
- No `LearningUnit` persistence entity is required.
- Lesson Renderer and Activity Registry are extended, not replaced.
- Attempts are immutable.
- ConceptEvidence is append-only.
- Mastery/review remain deterministic and versioned.
- Study Planner is deterministic.
- Question Bank is shared/versioned.
- Diagnostic and simulation use one Assessment Engine.
- Official exam exposure is protected.
- Published Lesson/Question versions are immutable.
- AI is optional/advisory to canonical learning state.
- Private roles are ADMIN and STUDENT; no public account product.
- Student UX is mobile-first.
- Design direction is Functional Neo-Brutalism + learning-first.
- The edital is authoritative for coverage; past Integrated exams are empirical style evidence.
- Full simulation represents 28 questions, seven per area and up to four hours.
- 2026.1 is the intermediate protected benchmark; 2026.2 is the final protected benchmark.
- Content publication is QA-gated.
- Four Golden Lessons are renderer regression fixtures.

Changing one of these durable decisions requires a new ADR or explicit supersession of the relevant ADR.
