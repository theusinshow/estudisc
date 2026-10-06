# 13 — Import and Export

## Import guarantees

- Untrusted input.
- Size limits before full parsing where possible.
- Schema and semantic validation.
- No executable UI payloads.
- Preview before mutation.
- Deterministic diff.
- Idempotency by stable ID and version.
- Atomic application.
- Import provenance and result stored.

## Conflict types

- same ID and same version with different content;
- unsupported schema version;
- missing dependency;
- deleted or renamed referenced concept;
- invalid stable-ID relationship;
- local content override conflict.

`APPLY` remains disabled while unresolved conflicts exist.

## Export types

### Teacher Context

Selectable current lesson, mastery evidence, recent attempts, mistakes, review queue, notes and projects. Preview content and approximate size before export.

### Backup

Complete user-owned state plus necessary content references, manifest, schema versions and checksums.

### Progress

Portable user progress and evidence without including unnecessary private notes unless selected.

## Restore modes

### `pack_manifest_apply`

Current V1 mode. Restores Pack manifests from Backup exports through the normal Pack importer and never overwrites local user state.

### `user_state_dry_run`

Required mode before full user-state restore. The preview contract now includes `estudisc.user-state-restore-dry-run.v1`, which fingerprints the Backup, counts user-state categories and reports why apply remains disabled. The dry-run foundation validates the shape of append-only/projection categories and prepares for restore provenance/idempotency checks. `/exports` exposes this plan as a preview-only UI surface.

### `user_state_apply`

Future apply mode. It remains disabled until ADR 0016 requirements are implemented:

- restore provenance ledger;
- idempotency by source backup, source record and payload hash;
- content hash compatibility checks;
- explicit blocking conflict report;
- append-only import of historical records as new local records;
- deterministic rebuild/reconciliation of projections.

Attempts, XP, history, mistakes, reviews and gamification projections must not be replayed automatically by the V1 restore endpoint.

## Privacy

Exports are explicit user actions. The UI must show included categories and warn about private notes or source code.
