# ADR 0039 — Estudisc is the canonical product identity

Status: Accepted

## Decision

Estudisc is the only current product, application, brand and repository name. Vecta and KNOW/OS are historical names. Rename presentation, active documentation, nonpersisted identifiers and package metadata. Preserve factual historical records and immutable content.

Canonical ESTUDISC environment variables take precedence over deprecated KNOW_OS aliases in one parser. The application consumes only canonical properties. New signed account cookies use estudisc_session; valid kos_session cookies remain readable with the same signature and expiry rules. New exports use estudisc.export.v1 with the existing payload shape; restore accepts the historical know-os.export.v1 envelope. Changing identity does not require changing payload version or hashes of imported content.

Pack identities, content stable IDs, published versions, hashes, executed migration SQL, database names and historic URLs remain unchanged. Reconcile current state documents without rewriting historical truth. Preserve the production URL and GitHub repository identity through a rename of the existing repository, after successful validation.

## Consequences

Legacy readers preserve production sessions, configuration and backups. New writes establish the canonical identity. Removing legacy support requires a separate documented deprecation decision and evidence that existing data/configuration no longer depend on it. No production content reimport, republish, learner-state mutation or destructive database rename is part of this migration.

New Content Studio jobs explicitly store `namespace: estudisc`; archived requests without the field retain their original `vecta.studio.*` Pack IDs and original source titles. This optional tooling field does not change the runtime Pack schema. New claim prompt versions use Estudisc; existing job history is not rewritten. The deprecated CLI command forwards to the same implementation. Compatibility tests preserve legacy adapter outputs and lesson/Question identities.

Publication mode uses the existing audit table. New reviewed publication records the real authenticated actor, time and `editorial_reviewed` mode; direct events retain `admin_direct`. Historical missing actor/time remain unknown. No database migration or fake review is needed.
