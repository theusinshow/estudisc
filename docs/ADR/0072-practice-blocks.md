# ADR 0072 — Practice blocks replace time-budget sessions

Status: Accepted
Date: 2026-10-18
Supersedes ADR 0021 (deterministic planner) and ADR 0041 (weekly routine), point 7 of ADR 0060, and the time-budget part of ADR 0042 (its frozen activity snapshots stay).

## Context

ADR 0060 made continuous lessons the main study path, but Revisão and Erros still opened `/study/<id>` time-budget sessions ("Sessão de 10 min", lesson blocks, "Começar/Concluir sessão"), students still chose 10 or 15 minutes, and the weekly planner and `/plan` stayed behind flags. The owner found the flow confusing.

## Decision

1. **Study paths.** Hoje and Estudar open whole lessons (ADR 0060). Revisão and Erros practise in **blocks of up to 5 Questions**, one at a time, with a summary ("3 de 5 sem ajuda", ✓/↺, "Mais 5", "Voltar"). No time choice anywhere.
2. **Engine.** A block is a targeted `study_sessions` row created ACTIVE. Selection is unchanged (`TargetedSelection`, exposure policy, reserved Questions excluded, remediation excludes the missed Question); composition reuses the adaptive choices with an internal 60-minute budget and keeps the first 5 Questions. Items are `delivery: "questions"` with frozen snapshots.
3. **Target and resume.** `policyVersion` is `practice-block.v1|{target}` (`{kind:"review"}`, `{kind:"review",conceptId}`, `{kind:"remediation",mistakeId}`). The same target resumes the ACTIVE block at its first unanswered Question; a different target abandons it (Attempts keep counting). No migration.
4. **Completion and summary.** The screen completes the block when every Question has an Attempt. "Sem ajuda" counts a Question whose first Attempt in the block passed with no hint, no solution and no guess (ADR 0071). "Mais 5" appears when the same target still composes a block.
5. **API.** `POST /api/study-sessions` accepts `practice_block` and `complete`/`abandon`; `plan`, `quick_review`, `practice_mistake` and `start` are rejected. `FEATURE_SMART_MISTAKES` still gates the entry points; full access is still required.
6. **Retired.** `/plan` (redirects to Hoje), `/api/study-plan`, the routine planner UI, `SessionControls`, `TargetedPracticeControls` and the practice time pickers, the session chooser on Hoje, the enhanced catalog, and the flags `FEATURE_STUDY_PLANNER`, `FEATURE_ADAPTIVE_SESSION`, `FEATURE_CONTINUOUS_STUDY` (continuous study is unconditional).
7. **Legacy sessions.** Never created again. An open one stays dormant, is not shown on Hoje or Revisão, and its link shows a read-only summary with "Ir para Hoje".

## Consequences

- Mastery, ConceptEvidence, spacing, mistakes, achievements and Attempts are unchanged; blocks only change how Questions are offered.
- The engine's untargeted `plan()` (planner.v1/v2), routine constraints and `StudyPlanRepository` remain as dormant code exercised by tests; a later cleanup can remove them with their tests. Planner, routine and session tables stay as history and in exports.
- Production can drop the three retired env vars at any time; the flag schema ignores them.
