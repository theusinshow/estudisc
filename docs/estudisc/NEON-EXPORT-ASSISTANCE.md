# Neon free export assistance — actual result

Date: 2026-10-09. User authorized sending the prepared free export request by replying "reolva pae" to the concrete permission question.

The bounded request was submitted through the authenticated Neon Console AI assistant. The resulting conversation shows the user's message and an assistant response, independently confirming submission. It requested a temporary free allowance or complete export and human escalation, prohibited charges/upgrades/data modification, and included the verified project/branch IDs, transfer usage, storage size and billing period. No password, connection URI, API key or private learner record was transmitted.

## Observed response

- The Console assistant states it cannot authorize a temporary allowance or escalate to a human team member. This is an AI response, not a human support decision or ticket.
- It describes no free exception/export process available while compute is suspended. It confirms a pg_dump needs active compute and transfer access.
- It cannot verify the exact renewal timestamp; the authenticated billing page still shows Oct 2 to Nov 1, 2026.
- It links community Discord and documents snapshots as retained within Neon rather than downloadable external exports.

## Independent checks

The authenticated Backup & Restore page shows restore-from-history and snapshot creation, with no snapshots or schedule currently set. No external snapshot export/download was visible. No snapshot was created, no restore requested and no new branch/project created. [Neon's documented snapshot behavior](https://neon.com/blog/announcing-neon-snapshots-a-smoother-path-to-recovery) restores into a branch, which does not establish a new public transfer allowance for this exhausted project.

[Neon's support policy](https://neon.com/docs/introduction/support) lists Console AI/community help on Free but no official ticket entitlement. [Official quota FAQ](https://github.com/neondatabase/website/blob/main/content/faqs/free-plan-limits-and-quotas.md) confirms connections remain suspended until monthly renewal or upgrade and data is retained. No documented free self-service export route through this suspension was found.

## Current safe state / next action

Aiven estudisc-postgres is Running on Free-1-1gb, but remains empty. Production still points to the original Neon database. Complete backup/restore and production recovery are not achieved. No paid operation, credential read, destructive operation, source-pack replay or external public post occurred.

Within the user's free-only constraint, resume the complete dump/restore after the original allowance renews or a provider grants a verified free export exception. Do not promise an exact reset hour or falsely report successful migration. A paid temporary reactivation remains outside current authorization.

Validation: authenticated Console message/response, Billing and Backup & Restore UI; git diff --check for documentation. Application code is unchanged.
