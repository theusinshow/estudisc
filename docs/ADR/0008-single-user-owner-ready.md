# ADR 0008 — Build single-user now with ownership-ready data

Status: Superseded
Superseded by: ADR 0026 (single-owner constraint only; ownership boundaries remain).
Date: 2026-07-30

## Context

KNOW/OS needs a durable decision for this concern before implementation.

## Decision

The personal product should avoid multi-user complexity while preserving a realistic path to future accounts.

## Consequences

User-owned tables include owner identity; organizations, billing and marketplace are excluded.

## Review trigger

Revisit only when new evidence materially changes scale, security, product scope or implementation feasibility.
