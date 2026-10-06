# Estudisc visual context

## Overview

Canonical authority: `design-system/DESIGN_SYSTEM_INDEX.md` and `design-system/design-tokens.json`; current version: `design-system/VERSION`. ADR 0027 and the refresh in ADR 0030 record the historical evolution. Current tokens define saturated surface roles, 3px ink rules, solid offset shadows and rounder radii; color always pairs with a text cue. This document is a pointer, not a second token or version source.

## Colors

Students read and solve one item at a time on a phone under ordinary home/daylight conditions. Warm paper and dark ink preserve reading comfort; stronger surfaces identify interactions, examples and primary study actions.

Consume generated CSS variables from the canonical token JSON. Subject accents supplement semantic state and textual cues; state is never communicated by color alone. Exact colors and contrast contracts live in `design-system/COLOR_SYSTEM.md` and `design-system/ACCESSIBILITY.md`.

## Typography

Use Archivo for reading/interface and JetBrains Mono for technical metadata/code. Roles, weights and sizes remain in `design-system/TYPOGRAPHY.md` and the canonical tokens; this context does not introduce a new type scale.

## Layout

Keep prose readable, with few containers and a central reading column on wider screens. Student mobile navigation defaults to Hoje, Aprender, Progresso, Mais. Under ADR 0040 and `FEATURE_STUDY_PLANNER`, it becomes Hoje, Plano, Aprender, Revisar, Progresso; secondary/account destinations move to the topbar Sheet. Flagged Focus keeps explicit exit/main/skip link while removing global navigation. Desktop expands the same study destinations. Canonical composition: `design-system/SCREEN_SPECS.md` and `design-system/RESPONSIVE.md`.

## Elevation & Depth

Explicit borders, solid offset shadows, visible focus and short mechanical press feedback preserve the Estudisc visual identity. Use the existing canonical shadow, border, focus and motion tokens; reduced motion remains required.

## Shapes

New learning surfaces use moderate canonical radii and 56px answer targets. Other controls retain the accessibility minimum of 44px. Radii and target sizes remain defined by the canonical tokens and accessibility contracts.

## Components

Reuse `design-system/COMPONENT_REGISTRY.md` and existing feature components. The shared AppShell owns TopBar/navigation/Focus; native Dialog/Sheet and keyboard Tabs provide the tested foundation. StudyActionCard and TodayPlan display authoritative reasons and real session facts; `/plan` currently exposes existing sessions rather than a weekly routine. Tutor is contextual. Admin has denser editorial tools and existing permission boundaries. Programming Lab retains its approved technical controls.

## Do's and Don'ts

Preserve Estudisc identity and deterministic learning semantics. Use touch/keyboard paths, visible focus, non-drag alternatives, reduced motion and recoverable states. Follow `design-system/DESIGN_SYSTEM_INDEX.md` precedence; do not treat HTML prototypes or this context as a replacement for canonical specs. Do not invent planning availability, measured study time, review certification, content rights or admission guarantees.
