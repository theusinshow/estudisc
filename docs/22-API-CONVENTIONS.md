# 22 — API and Server Action Conventions

## IFSC mutation contracts

Require owner-bound idempotency keys for Attempt submission and assessment finalization. Persist Attempt/evidence/events/projections in one transaction; unique constraints prevent concurrent duplication. Assessment responses are mutable only while open. Freeze versions/order/timing/policies when activating an instance/session. Deliver student-safe question DTOs; withhold answer/solution/correctness during EXAM and reject reserved selection server-side.

## General

Use explicit validated boundaries. Do not expose database records directly as public response contracts.

## Input

- Validate path, query and body input.
- Reject unknown or unsupported schema versions.
- Apply request/file size limits.
- Normalize only when normalization is part of the documented contract.

## Output

Use stable response shapes with machine-readable error codes and user-safe messages. Do not leak stack traces, SQL errors or secrets.

## Idempotency

Pack imports are naturally idempotent by content ID/version and may later support explicit idempotency keys. Mutations that can be retried should avoid duplicate Attempts or XP transactions.

## Transactions

Use database transactions for atomic domain operations such as submission record + evidence/event projection and Pack application.

## Server actions

If Next.js Server Actions are used, treat them as API boundaries: validate input, enforce ownership and return typed results. Do not rely on hidden form fields as authorization.
