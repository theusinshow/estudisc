# Estudisc CI suites

`Estudisc CI` runs lint, typecheck, unit and build as separate fast jobs. Integration, content QA, Pack validation and critical student/admin E2E start only after these gates. Each job has a finite workflow budget. Full local acceptance still runs all tests and both full browser projects.

The failing main run 37410797711 timed out Science import QA at 34,822 ms against a 30,000 ms limit. The disposable PGlite setup previously executed each migration statement separately. It now reads independent SQL files concurrently and executes their ordered statements in one DDL transaction, preserving separate databases and full migration coverage.

Heavy import/publication tests belong to a serial content-QA suite with a finite 90-second test budget. Integration uses one worker and 60 seconds; unit checks use at most two workers and 15 seconds. This prevents a large Pack and WASM setup competing with other content imports on small runners. No infinite timeout, shared learner fixture or deleted coverage was introduced.

`pnpm test:unit`, `pnpm test:integration`, `pnpm test:content-qa` and `pnpm test:e2e:critical` define the corresponding boundaries. The full `pnpm test` remains available. E2E owns a new Next process per browser project because the memory repository is process-global; output is retained per project.

Main protection requires the actual check names: `lint`, `typecheck`, `unit`, `build`, `integration`, `content-qa`, `pack-validation`, `critical-e2e`. Remote configuration and exact run results are recorded in the consolidation report.
