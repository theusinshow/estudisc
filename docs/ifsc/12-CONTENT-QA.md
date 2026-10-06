# 12 — Content QA

Status: **Accepted**
Source of truth for: publication quality gates.

## Publication paths

Editorial Reviewed requires the four independent layers below. Admin Direct is the separate authorized path with authenticated ADMIN, exact versions, explicit reason and atomic audit event; it does not fabricate reviews. Current operational contract: [EDITORIAL-RELEASE.md](EDITORIAL-RELEASE.md). Publication mode is visible in Admin.

## Four QA layers (Editorial Reviewed)

1. Structural QA
2. Factual QA
3. Pedagogical QA
4. IFSC Alignment QA

## Structural QA

Prefer deterministic checks:

- schema valid;
- referenced Concepts exist;
- prerequisites exist and graph is valid;
- block/activity types registered;
- question refs exist;
- objective coverage;
- answer definitions present;
- exit ticket when required;
- sources present when required;
- no reserved-question leakage.

Structural errors block publication.

## Factual QA

Check:

- factual correctness;
- mathematical calculation;
- definitions/formulas/dates;
- source support;
- correct answer;
- no multiple defensible choices.

Wrong answer keys are `CRITICAL`.

## Pedagogical QA

Evaluate:

- prerequisite respect;
- objective alignment;
- cognitive load;
- explanation clarity;
- worked example quality;
- guided practice;
- independent practice;
- useful interaction;
- transfer;
- feedback/remediation.

Use structured findings, not a vague “looks good.”

## IFSC Alignment QA

Check whether applied/transfer questions are appropriately contextualized and comparable in reasoning demand to observed Integrated exams without forcing every exercise to mimic the official style.

## Severity

- `INFO`
- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

Suggested publication behavior:

- INFO/LOW: non-blocking;
- MEDIUM: fix before publish unless explicit editorial override with reason;
- HIGH/CRITICAL: block.

## Reviewer independence

The authoring run does not approve itself. Reviewers receive content/spec/sources/rubric and return issues. Revisions go back through validation.

## Planner readiness

A Lesson becomes planner-ready only when:

- published;
- Concepts mapped;
- prerequisites valid;
- practice pool sufficient;
- exit ticket available;
- review-eligible questions exist;
- QA approved.
