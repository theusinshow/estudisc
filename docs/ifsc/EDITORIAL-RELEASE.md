# Editorial release and optional tutor

V2 imports store content as draft even when an incoming manifest claims publication. They register immutable lesson/question/curriculum author and content hashes in the same transaction. Reimporting unchanged content retains its original author; changing a stable version is rejected. Separate module snapshots allow unchanged lesson versions in later Track Packs without rewriting historical track context.

`/admin` exposes sources, original question content, lesson previews, derived coverage and the QA queue. JSON actions reuse the existing importer and assessment engine. `/api/admin/content-qa` accepts register, review and publish actions. ADMIN is required at the handler as well as the route guard.

All four layers require independent approval: STRUCTURAL, FACTUAL, PEDAGOGICAL, IFSC_ALIGNMENT. Reviews are append-only. HIGH/CRITICAL block publication. MEDIUM requires an explicit editorial rationale. The author cannot review their own registered version. Question assets must exist. Lessons require objectives, an exit ticket and at least two published training questions per Concept. The planner requires a published QA release. A single administrator importing content therefore cannot silently approve it.

No independent reviews have been fabricated for bundled seeds. A second authorized reviewer must assess the actual sources and findings before publication. Disposable test fixtures simulate publication explicitly and are not evidence of content approval.

The optional contextual tutor reuses the existing server DeepSeek gateway, bounds input/output, minimizes context and supports SOCRATIC/EXPLAIN/REVIEW/QUESTION_HELP. It is disabled by the same server EXAM guard as question assistance. Every model consultation conservatively records solution exposure before calling the provider because free-form assistance can reveal an answer. No provider key is needed to study, score, schedule reviews or plan. Provider output never changes canonical content, mastery or planner policy.
