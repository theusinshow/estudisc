# Editorial QA rubric

The Reviewer is independent from the Author. It identifies issues with targeted fixes; the Author revises. This Studio review recommends human export inspection and does not replace Estudisc's production publication QA.

## Dimensions

| Category | Inspect |
| --- | --- |
| `STRUCTURAL` | Runtime schema, IDs/references, registered payloads, valid answers, required exit ticket; deterministic validator must pass first |
| `FACTUAL` | Claims trace to verified evidence; formulas, examples, answer keys and explanations correct; no fake sources |
| `PEDAGOGICAL` | Objectives/prerequisites, short explanation/action/feedback cycles, retrieval before summary, useful scaffolding and independent practice |
| `IFSC_ALIGNMENT` | Authoritative curriculum coverage preserved; appropriate transfer/context/stimulus/distractors; no invented official identity |
| `MEDIA` | Useful, accurate, produced assets, appropriate video segments, supplemental books/video and traceable selection |
| `COPYRIGHT` | Verified embedding rights, accurate attribution, no unauthorized textbook/exam copying |
| `ACCESSIBILITY` | Meaningful alt/text alternatives, mobile legibility, touch/keyboard behavior of registered interactions, no color-only meaning |

## Severity and decision

| Severity | Meaning |
| --- | --- |
| `INFO` | Observation or optional refinement |
| `LOW` | Small clarity or polish issue |
| `MEDIUM` | Material improvement needed; document its disposition explicitly |
| `HIGH` | Blocks editorial approval until corrected |
| `CRITICAL` | Serious correctness, rights, authenticity or safety failure; blocks approval |

Wrong answer keys, multiple defensible answers in a single-answer MCQ, serious factual errors, fake citations, false official provenance, unauthorized embedded media and broken/unsafe learning interactions are CRITICAL examples.

Use `NEEDS_REVISION` for correctable issues and state a specific `requiredFix`. Use `REJECTED` for unsuitable/unrecoverable delivery. Use `APPROVED` only if deterministic validation passes, evidence is sufficient and no HIGH/CRITICAL issue remains. Optional residual issues must be visible in the summary. Do not change severity just to obtain approval.

## Report protocol

`review/qa-report.json` follows the exported `QAReport` schema. Include the actual `reviewerId` equal to the active claim owner, `inputHashes` copied from `state.active.inputHashes`, decision, summary, `dimensions` containing all seven categories and findings. Reviewer owner must differ from Author owner. Every finding includes stable ID, severity, category, target ID/path, message, evidence and `requiredFix` (use an explicit optional recommendation for informational findings).

Illustrative finding (the complete report has additional schema fields):

```json
{
  "id": "qa-answer-01",
  "severity": "CRITICAL",
  "category": "FACTUAL",
  "target": "q-cie06-01.answer",
  "message": "Answer key does not match the worked reasoning.",
  "evidence": "The stated proton count is inconsistent with the number used in the solution.",
  "requiredFix": "Recalculate the key and explanation, then verify every distractor against the corrected value."
}
```

Bind findings to the exact draft. If an input changes after the review claim, request a new validated handoff rather than approving stale hashes. The CLI retains revision history. The default maximum is three automatic revisions, then human intervention.

## Human publication boundary

An agent `APPROVED` report yields `HUMAN_REVIEW_REQUIRED`. The owner may record local export approval only after examining the exact artifacts. Runtime exported statuses stay `draft`; `/admin/review` still requires its real independent human reviews. A simulated DEMO promotion must be visibly simulated and cannot count as that approval. Missing teaching content and unverified curriculum mappings remain visible even when structural validation succeeds.
