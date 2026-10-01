# 14 — Admin CMS

Status: **Accepted**
Source of truth for: minimum administration surface.

## Goal

Enable one administrator to understand coverage, inspect content, resolve QA issues and publish safely. A sophisticated visual authoring suite is not required before the exam.

## Areas

- Curriculum
- Lessons
- Question Bank
- Official Exams
- Assessments
- Sources
- QA
- Students
- Analytics
- Settings

## Curriculum

Show:

- requirement tree;
- MAPPED/COVERED/VALIDATED status;
- unmapped count;
- Concepts and prerequisites;
- question coverage;
- affected Lessons.

## Lesson editor MVP

Structured editor, not arbitrary WYSIWYG.

Capabilities:

- block list;
- validated configuration;
- preview using the same student renderer;
- source links;
- version/status;
- QA issues;
- publish/retire.

JSON editing may be the first authoring surface if preview and validation are strong.

## Question Bank

Filter by:

- subject;
- Concept;
- difficulty;
- cognitive operation;
- provenance;
- exposure;
- status.

Show answer/explanation/distractor rationale to Admin only.

## Official exam controls

Reserved/unlock status must be visible and difficult to change accidentally.

## QA queue

Prioritize:

- CRITICAL/HIGH;
- planner-blocking content gaps;
- suspicious question performance;
- missing coverage.

## Student view

Admin may inspect learning summaries needed to support the private student, without turning the product into a surveillance dashboard. Keep raw personal data minimal.
