# 07 — Technical Architecture

## Architectural style

A modular monolith provides one deployable web application with explicit feature and domain boundaries. This minimizes operational overhead while preserving clear seams for future extraction.

## Planned stack

- Next.js App Router
- React
- TypeScript strict
- pnpm
- Tailwind CSS with generated design tokens
- accessible component primitives informed by shadcn/ui patterns where appropriate
- PostgreSQL
- Drizzle ORM and migrations
- Zod validation
- Monaco Editor for programming UI
- isolated browser runtime adapter for JavaScript
- Vitest and Testing Library
- Playwright

Version numbers must be selected from stable compatible releases during scaffold and recorded in the lockfile. Documentation should not guess future package versions.

## Layers

```text
UI / Routes
    ↓
Feature application services
    ↓
Domain rules and policies
    ↓
Repositories / adapters
    ↓
PostgreSQL, runtime, filesystem/export boundaries
```

Feature modules may expose a small public API. Cross-feature imports should flow through those APIs rather than reaching into internal folders.

## Design token pipeline

`design-system/design-tokens.json` is canonical. A script generates CSS custom properties. Generated output is checked in for predictable builds but never edited manually.

## Deployment posture

V1 should be deployable to a conventional Node-compatible platform with managed PostgreSQL. ADR 0015 selects Vercel and Neon; ADR 0026 refines private owner mapping. The application must remain runnable locally.

## Authentication posture

Local development may use a seeded owner. Before internet-accessible production use, an ADR must approve the authentication mechanism and session model.
