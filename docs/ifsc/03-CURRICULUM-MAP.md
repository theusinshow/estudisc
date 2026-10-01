# 03 — Curriculum Map

Status: **Accepted**
Source of truth for: coverage states, prerequisite graph and curriculum importance.

## Requirement model

Each official program statement is decomposed into atomic `CurriculumRequirement` records.

Example:

```yaml
id: IFSC27.MAT.NUM.PERCENTAGE
source: EDITAL-05-DEING-2027-1
sourceSection: ANEXO-V-MAT-1
label: Porcentagem
mappedConcepts:
  - MAT.PCT.CONCEPT
  - MAT.PCT.CONVERT
  - MAT.PCT.CALCULATE
  - MAT.PCT.DISCOUNT
  - MAT.PCT.INCREASE
  - MAT.PCT.INTERPRET
```

A parent source line may map to many atomic requirements.

## Coverage states

- `UNMAPPED`: no Concepts assigned.
- `MAPPED`: Concepts exist.
- `COVERED`: planner-ready published content covers required Concepts.
- `VALIDATED`: QA confirmed coverage and mapping.

`100% MAPPED` is not the same as `100% VALIDATED`.

## Prerequisites

Prerequisite relation:

```ts
type PrerequisiteStrength = "required" | "recommended";
```

Required prerequisites may materially affect Planner sequencing. Recommended prerequisites influence priority but should not create rigid locks.

Example:

`fraction basics + decimal basics + proportion basics → percentage calculation`

Prerequisites support:

- diagnostic branching;
- remediation;
- Study Planner;
- explanation of learning difficulty.

## Curriculum importance

Track-specific importance:

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

Importance does not remove low-priority official content.

## Student priority

Do not persist a single permanent “priority score” as curriculum truth.

`studentPriority` is recomputed from:

- curriculum importance;
- weakness/mastery;
- retention/review urgency;
- prerequisite blocking;
- exam proximity;
- available time;
- subject balance.

## Curriculum map vs exam blueprint

Curriculum Map answers: **what must be learned and how concepts depend on each other?**

Exam Blueprint answers: **how official questions package and assess those concepts?**

A Question connects the two.
