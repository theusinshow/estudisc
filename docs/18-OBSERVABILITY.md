# 18 — Observability

## IFSC metrics

Record safe duration/count/status metrics for planner decisions, assessment autosave/finalization retries, generation usage, QA blockers, exposure rejection and curriculum gaps. Policy/version IDs support audits. Avoid raw answers, lesson text, protected questions or unrelated student history in operational logs.

## Goals

Enable debugging without collecting unnecessary personal learning content.

## Structured logs

Log event name, request/correlation ID, severity, duration, feature and safe identifiers. Avoid raw Pack content, learner code, private notes, credentials and full exported context.

## Metrics

Potential operational metrics:

- route and action error rates;
- Pack validation/import duration and failure category;
- runtime execution timeout/error rate;
- database latency;
- job or queue backlog if introduced;
- client-side crash count.

Product analytics are separate and require privacy review.

## Error reporting

User-facing errors use safe IDs that can correlate with internal logs. Stack traces remain internal in production.

## Health

Provide lightweight application and database health checks. A health response must not reveal configuration or secrets.
