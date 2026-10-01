# Private official bank ingestion

The retained Python script `scripts/ingest-ifsc-official.py --render` builds `.local/ifsc-official/bank.draft.json` from the four Integrated exam PDFs and definitive answer keys under `sources/ifsc/historical`. It imports neither Subsequente nor preliminary keys. Both directories are ignored and outside `public`.

Current local inventory: 112 original identities, 28 per edition; 303 immutable PNG references; 56 questions reserved for the 2026 editions. Question 15 of 2025.1 is annulled and cannot score or generate mastery evidence. Every original PDF and rendered image has SHA-256 provenance.

The 2025.2 PDF has unusable text encoding. `scripts/ocr-ifsc-pdf-pages.ps1` uses installed Windows OCR without uploading material. The resulting text is a draft. Question 18 was transcribed manually against original page 15 after OCR mixed the cartoon column into choice B. No missing-choice placeholders remain, but this is not independent transcription approval.

All classifications and accessible image descriptions remain pending independent source review. Full-page images preserve diagrams, tables and original layout. Reviewers must verify stimulus page coverage and text ordering, not merely the answer key or parser counts. Official text must never be included in a public seed or client export before the permitted assessment context.

Assets are stored as authenticated database PNGs (5 MB / 16 megapixel limits), never in a public image optimizer. Admin imports use `/api/admin/question-assets`; students can read only images granted by their own opened question or frozen assessment. Immutable identity/hash conflicts are rejected.

The local bank contract/hash smoke test runs when private materials exist and skips on CI without them. This confirms integrity and counts, not factual/pedagogical QA.
