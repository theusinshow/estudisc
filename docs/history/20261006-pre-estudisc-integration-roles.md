# Science integration ownership

- VECTA SCIENCE INTEGRATOR: real internal agent /root/science_integrator; high effort; contracts, importer/adapter infrastructure and architecture tests.
- VECTA SCIENCE IMPORT WORKER: real internal agent /root/science_import_worker; medium effort; execution and deterministic media assets.
- VECTA SCIENCE QA: real internal agent /root/science_qa; medium effort; tools/science-import/qa, source fidelity and independent deterministic QA.
- Primary Maestro: coordination, PLANS.md/PROJECT_STATUS.md/CHANGELOG.md, CURRENT-STATUS.md/NEXT.md, final application checks.

Exactly three workers. Agents communicate primarily through persistent reports, one job per dispatch. No editorial approval.
