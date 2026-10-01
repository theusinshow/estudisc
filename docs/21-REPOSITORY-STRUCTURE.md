# 21 — Repository Structure

## IFSC feature additions

Add src/features/curriculum, questions, study-sessions, planner, assessments, content-qa and tutor. Extend existing lessons/activities/attempts/mastery/review/recommendations/generation/import. Migrations remain in src/db/migrations, not the package suggested db/schema/migrations path. Private source PDFs live under sources/ifsc; protected originals must never be served by public/.

## Planned structure after scaffold

```text
src/
├── app/                    # Next.js routes and composition
├── components/
│   ├── ui/                 # approved primitives
│   └── layout/             # shell and layout composition
├── features/
│   ├── tracks/
│   ├── lessons/
│   ├── concepts/
│   ├── activities/
│   ├── attempts/
│   ├── progress/
│   ├── practice/
│   ├── review/
│   ├── mastery/
│   ├── mistakes/
│   ├── history/
│   ├── projects/
│   ├── gamification/
│   ├── import/
│   └── export/
├── domain/                 # cross-feature domain contracts/policies
├── db/
│   ├── schema/
│   ├── migrations/
│   ├── repositories/
│   └── queries/
├── runtime/                # code runtime adapters/workers
├── lib/                    # narrow infrastructure helpers
├── hooks/
├── types/
└── styles/
```

## Rules

- A feature owns its UI, application logic and internal adapters.
- Shared UI primitives contain no product-specific business rules.
- `lib/` is not a dumping ground; helpers require a clear infrastructure purpose.
- Domain rules avoid framework imports where practical.
- Database schema is grouped by domain but migrates as one application.
- Generated token CSS lives in a clearly named generated path.
- Runtime worker code has a nested `AGENTS.md` when implementation begins because its security rules are stricter.

## Current placeholder folders

Empty folders contain README files explaining their intended role. Codex may restructure them during Phase 0 if it records the final structure and preserves the modular boundaries.
