# 23 — Error Handling

## Pedagogical errors

Learning-error taxonomy is distinct from system/runtime failure: CONCEPTUAL, PROCEDURAL, CALCULATION, INTERPRETATION, PREREQUISITE, DISTRACTOR, ATTENTION, MEMORY, UNKNOWN. Classification precedence: deterministic rule, known distractor, student report, advisory AI inference, UNKNOWN. Repeated errors trigger remediation; network/autosave failures preserve recoverable work.

## Error categories

- validation;
- not found;
- conflict/version;
- authorization/ownership;
- persistence;
- runtime syntax;
- runtime execution;
- timeout/resource limit;
- unexpected internal failure.

## User-facing behavior

Errors state what happened, preserve work, provide a safe next action and avoid blame. Learning errors can name the relevant concept and explain why the result occurred.

## Domain errors

Use typed domain/application errors with stable codes. Infrastructure errors are translated at boundaries.

## Logging

Unexpected errors receive a correlation ID. Sensitive payloads are not logged.

## Runtime errors

Programming errors are learning output, not application crashes. Syntax/runtime/test failures appear in the Programming Lab. Sandbox failures or internal evaluator failures are system errors and must be distinguished clearly.
