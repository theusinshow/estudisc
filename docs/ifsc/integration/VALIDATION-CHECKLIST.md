# Package Validation Checklist

Before integrating this specification package into the repository:

- [ ] Read root README and integration plan.
- [ ] Ensure existing repository ADR numbering still ends at 0016 before adding 0017–0029, or reconcile numbering deliberately.
- [ ] Check no newer core implementation decision conflicts with the July/August repository audit used for this package.
- [ ] Merge ADR 0008 supersession metadata rather than deleting its history.
- [ ] Apply Design System v3 as a delta to the canonical token source, not a second runtime design system.
- [ ] Validate `caderno.track.v2.schema.json` with the project schema tooling.
- [ ] Add semantic validators listed in `packs/README-IFSC-V2.md`.
- [ ] Implement IFSC milestones sequentially; do not bulk-create untested modules.
- [ ] Preserve production authorization boundaries for push/deploy/migrations.
- [ ] Recheck official exam files/answer keys before importing the 112 historical questions.
