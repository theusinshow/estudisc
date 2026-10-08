# ADR 0053 — contextual AI boundaries and cost controls

Date: 2026-10-08. Status: Accepted for implementation under continuous evolution authorization.

## Context and decision

Reuse the existing optional tutor and server generation gateway for explainDifferently, giveHint, analyzeMistakes, summarizeSession and explainConceptRelation. A feature service resolves canonical contexts on the server; clients send only bounded references/action/message and a request UUID. Published block/version, immutable shared Question/version and owned session/mistake facts remain authoritative. Relation explanations require an actual authored edge and published Concepts. No parallel learning engine or model-owned decision is introduced.

Question assistance validates the existing study context and excludes reserved Questions even after a training unlock. Before returning any generated or cached Question help, attest solution exposure through the existing interaction path: free-form output can reveal an answer in any mode. Preserve and disclose actual attestation even when the subsequent provider call fails; absence before attestation does not expose a solution or create a successful Attempt. All AI actions are blocked in an active EXAM context. Send no assets/URLs, credentials, owner identifiers, arbitrary client context, full histories or unsupported diagnoses; the optional bounded student question is data, not a system instruction. Mistake/session contexts contain only bounded factual projections. Generated text is clearly attributed and rendered as escaped text.

Use the existing configured provider/model via a bounded adapter; no automatic stronger-model fallback or repair retries. Provider calls accept cancellation and a short timeout. Inputs and structured outputs have fixed bounds; invalid output is a recoverable failure. Learning continues using authored material when AI is disabled/unavailable.

## Reservations, cache and usage

Append owned StudyEvents using the existing owner transaction lock; no new table, backfill or mutation of historical records. Reserve each provider request before dispatch. Enforce six provider calls per rolling minute, twenty per UTC day, at most two pending calls within the timeout window, and thirty total requests per minute including cache hits. Failed/cancelled calls consume their reservation, since remote usage may already have occurred. A reused request UUID is idempotent only for its original canonical context/action; conflicting reuse fails. Cache hits do not renew the original provider result's one-hour lifetime.

Cache successful validated output for one hour, scoped by owner, canonical source/content version/hash, action/message, prompt policy and provider/model. Validate ownership, exposure and exam state before a cache hit; caches cannot bypass assistance attestation. Request/completion events retain only bounded output and safe usage/status/source hashes, not prompts or raw provider responses. Token/cost figures reuse the existing versioned pricing/usage contract; estimates remain estimates. Call/input/output caps bound cost without promising an exact monetary amount.

Concurrent identical contexts wait for their existing reservation rather than duplicating provider calls. Prior policy versions still count toward the owner's minute/day limits. Student history shows readable consultation/reflection entries and omits internal request reservations; the owned backup retains the complete immutable ledger.

## Compatibility and acceptance

`FEATURE_AI_LEARNING` gates new actions/presentation; preserve existing tutor request compatibility through the same controlled service. Existing authored hints, submissions and assessments work without a provider. Test unconfigured/timeout/cancel/invalid output, foreign/stale context, reserved/EXAM denial, cache scope/version/policy changes, duplicate/conflicting/concurrent requests, quota/usage and SQL/memory parity. Disable the feature for rollback; immutable Attempts/evidence and existing assistance/usage records remain interpretable. Do not fabricate a provider response, diagnosis, independent review or production activation receipt.
