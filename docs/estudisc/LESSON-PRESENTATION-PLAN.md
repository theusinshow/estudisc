# Lesson presentation foundation

User request: refine lesson frontend spacing, readability, Portuguese accents/ç and numerical expressions. Session-access repair is confirmed working by the user. This work takes priority over the separate scored-enrichment contract and requires no new editorial approval.

## Established state

- The application through Phase 14 is delivered; all 132 original lesson identities remain published. Whole-corpus interactive enrichment remains partial. The latest continuation published 12 source-defined predictions; these are additions to earlier releases, not a count of all enriched lessons.
- Remaining content work: enrich suitable remaining lessons using existing components, improve worked examples/visuals/exploration, and add independently scored practice through the shared Question/Activity pipeline where appropriate.
- New persisted scored Questions/lesson bindings need the bounded Terra contract in `handoffs/2026-10-10-scored-enrichment-contract.md`. Existing importer retention guards must remain. That boundary does not prevent visual frontend work.
- Shared `src/components/ui/paragraphs.tsx` currently renders escaped plain text and line breaks. Existing block renderers reuse it. The approved Archivo/JetBrains typography must remain.
- Read-only current production audit covered 132 latest published identities plus legacy CIE-01 v1: 25,487 payload string fields; zero U+FFFD, common mojibake, decomposed Unicode or TeX markers. Two missing-accent candidates were the same correctly cited URL slug. 190 fields contain Unicode mathematical symbols. This is a bounded encoding scan, not proof that every font, SVG label, line-wrap or device renders perfectly.
- Live MAT-12 uses UTF-8 and retains accented words and superscripts; no semantic math renderer is present. A measurement of a hidden step is unsuitable as evidence of reading-column width. Diagnose visible steps and actual device layout before changing spacing.

## Execution increments

1. **Reading and glyph diagnosis — Luna Max.** Inspect representative Mathematics/Science/Portuguese lessons in visible step/all modes on narrow screens and desktop. Check font loading, paragraph/label line boxes, accents/ç, SVG text, lists and formula wrapping. Distinguish source spelling from visual clipping or font failures. Record only compact public examples; keep private profile details out of artifacts.
2. **Shared reading foundation — Luna Max.** Refine existing paragraph/block/question presentation with approved tokens: consistent heading/paragraph/example spacing, controlled reading width, mobile padding and touch controls. Fix only demonstrated Unicode/font/layout failures. Preserve source text and published hashes; text corrections in source require a new version rather than mutating a published payload.
3. **Mathematical presentation — Luna Max.** Define an explicit, bounded recognition contract before rendering fractions, powers, roots, units and aligned equations. Existing content has no explicit TeX markers, so a TeX-only renderer would not improve these lessons automatically. Preserve original prose, dates, URLs and code; ambiguous/unrecognized syntax stays exactly as authored. Use the current renderer, accessible semantic output/text equivalents and responsive equation overflow, without evaluating or changing answers.
4. **Representative acceptance and release — Luna Max.** Cover valid Portuguese text and mathematical recognition/fallback with focused tests; verify visible 320/375/desktop layouts and keyboard/touch. Run configured lint/typecheck/tests/packs/build/full serial browser gates, preserve owner isolation and immutable content, update docs/status/changelog, then release through protected CI/Git-backed deployment under standing authorization.

## Limits and routing

No Design System replacement, corpus re-import, automatic guessed accent correction, source/Question mutation, parallel renderer or new mastery/review engine. Presentation and mechanical implementation remain economical Luna work. Terra is reserved for the separate persisted scored-enrichment contract or a genuine pedagogical/domain decision; Sol High is not needed for this frontend refinement.

NEXT ACTION: increment 1, then the smallest demonstrated shared presentation correction. No production frontend change or speculative encoding fix was made by this audit.
