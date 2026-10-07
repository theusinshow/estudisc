# ADR 0051 — explicit discrete input in existing linear exploration

Date: 2026-10-07. Status: Accepted for implementation. Extends ADR 0050.

An authored count example needs whole input quantities while time/length examples can accept fractions. Add optional integerInput to the existing bounded linear payload. Absence retains the exact previous fractional input behavior; no default is injected into old content. The linear formula, model kind, response shape and evidence meaning are unchanged.

With integerInput=true, authored min/max/step/initial must all be integers. The renderer computes/displays output only for integer input within that range, and otherwise supplies explicit recovery feedback. Raw bounded unsent strings—including invalid values—remain display drafts under the existing resume contract; they never become a grade, Attempt or mastery evidence. Slider/resume flags and baseline local-state isolation stay unchanged.

This is an additive payload field, not a Pack envelope change. Migration plan: no DDL, data transform, backfill or rewrite of published versions. Existing readers retain the bounded linear fallback; deploy updated validated readers before publishing new configured versions. Compatibility fixtures preserve old decimal/time controls and test discrete configuration/input failures. Code rollback leaves old published versions accessible; new versions remain immutable.

The representative batch uses existing authored mathematics goals/rates/units. Broader numeric keyword stems only improve deterministic proposal classification; UNREVIEWED, source/rights/mapping caveats and heuristic confidence remain factual, never publication approval. Missing goals remain missing. Actual authenticated Admin Direct supplies release actor/reason under the standing social authorization.
