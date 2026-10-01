# Editorial release and optional tutor

V2 imports store content as draft even when an incoming manifest claims publication. They register immutable lesson/question/curriculum author and content hashes in the same transaction. Reimporting unchanged content retains its original author; changing a stable version is rejected. Separate module snapshots allow unchanged lesson versions in later Track Packs without rewriting historical track context.

`/admin` exposes sources, original question content, lesson previews, derived coverage and the QA queue. JSON actions reuse the existing importer and assessment engine. `/api/admin/content-qa` accepts register, review, publish and retire actions. ADMIN is required at the handler as well as the route guard.

All four layers require independent approval: STRUCTURAL, FACTUAL, PEDAGOGICAL, IFSC_ALIGNMENT. Reviews are append-only. HIGH/CRITICAL block publication. MEDIUM requires an explicit editorial rationale. The author cannot review their own registered version. Question assets must exist. Lessons require objectives, an exit ticket and at least two published training questions per Concept. The planner requires a published QA release. A single administrator importing content therefore cannot silently approve it.

The user chose draft content for human review. No independent reviews have been fabricated for bundled seeds. A second authorized human reviewer must assess the actual sources and findings before publication. Disposable test fixtures simulate publication explicitly and are not evidence of content approval. Rejecting a published release records the finding and withdraws it; a retired stable version cannot be republished. Correct the content in a new version.

## Admin JSON workflow

V2 imports automatically register draft releases. The QA queue shows the release UUID. Send one independently justified review per layer using the QA action panel, then publish only after the four real reviews and structural/coverage checks pass:

```json
{"action":"review","releaseId":"REPLACE_WITH_RELEASE_UUID","review":{"layer":"FACTUAL","verdict":"APPROVE","rationale":"REPLACE_WITH_ACTUAL_SOURCE_CHECK_AND_REASONING","findings":[]}}
```

Use the other three layer names for their corresponding checks. Findings have `severity` and `message`; MEDIUM findings need `editorialOverrideReason` if deliberately accepted. A wrong answer key is CRITICAL. Publication uses `{"action":"publish","releaseId":"REPLACE_WITH_RELEASE_UUID"}`; withdrawal uses `retire`. Example text is a request shape, never a preapproved review.

`/api/admin/content-generation` supports `compile` with a validated GenerationSpec targeting `caderno.track.v2` and `sourcePackContext`. It stores an existing GenerationJob and returns its UUID plus the manual prompt. `validate` and `import` take that `jobId` plus `pack`; generated Questions must have draft status and provenance linked to that exact run. The workflow requires persistent PostgreSQL and never auto-publishes. The existing v1 generation flow is preserved.

The optional contextual tutor reuses the existing server DeepSeek gateway, bounds input/output, minimizes context and supports SOCRATIC/EXPLAIN/REVIEW/QUESTION_HELP. It is disabled by the same server EXAM guard as question assistance. Every model consultation conservatively records solution exposure before calling the provider because free-form assistance can reveal an answer. No provider key is needed to study, score, schedule reviews or plan. Provider output never changes canonical content, mastery or planner policy.
