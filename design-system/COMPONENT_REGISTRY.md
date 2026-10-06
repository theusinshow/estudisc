# Estudisc — Component Registry

Search existing components/features before adding one. Status describes rollout/design, not pedagogical certification. Canonical values remain in DESIGN_SYSTEM_INDEX.md, design-tokens.json and VERSION.

| Component / capability | Status | Source / consumer | Contract |
|---|---|---|---|
| Button / Input / Progress | FOUNDATION | Native controls; application CSS | Canonical tokens, focus and 44px targets; no redundant wrapper |
| AppShell / TopBar / BottomNavigation | FOUNDATION | `src/components/layout/`; primary pages | Legacy default; five destinations under FEATURE_STUDY_PLANNER |
| FocusShell mode | EXPERIMENTAL | AppShell; lesson/ACTIVE study/assessment routes | Flagged; main/skip/exit preserved; exit does not change session status |
| Dialog / Sheet | FOUNDATION | `src/components/ui/dialog.tsx`; topbar menu | Native modal, title, Escape, focus containment/return |
| Tabs | FOUNDATION | `src/components/ui/tabs.tsx`; `/plan` | Manual activation, arrows/Home/End, Enter/Space, labeled panels |
| SegmentedControl | EXPERIMENTAL | Not implemented | Add for a concrete routine-form need; prefer native radio semantics |
| Reveal / CountUp / Motion | APPROVED | Existing motion components/screens | Canonical tokens and reduced motion |
| StudyActionCard | EXPERIMENTAL | `src/features/today/`; FEATURE_NEW_TODAY | Reason, one destination; no invented count/duration; six study variants plus project |
| TodayPlan | EXPERIMENTAL | `src/features/today/today-plan.tsx` | Real session snapshots, no invented routine/day-off |
| LessonSteps / LessonStepper | APPROVED | Existing lesson feature | Runtime projection and URL-step resume; completion is not mastery |
| LessonBlockRenderer / Activity registry | APPROVED | Existing lesson/activity features | Only learning dispatch extension points |
| Figure / NumericExplorer / AtomModel | APPROVED | Existing lesson blocks | Image safety/text alternatives; exploration is not an Attempt |
| Matching / Ordering / Classification | APPROVED | EducationalActivityPanel | Native select/buttons; local feedback; durable assessment separate |
| QuestionPanel / ResponseFields / Hints | APPROVED | Shared Question/activity paths | Immutable attempts and recorded assistance/evidence |
| Mastery / Review / Mistake / Progress views | APPROVED | Existing feature modules | Canonical deterministic policy projections |
| AssessmentPanel | APPROVED | Existing unified engine | Server deadline, saved responses/flags, delayed result, EXAM blocks tutor |
| InteractiveMap / Knowledge canvas | EXPERIMENTAL | Not implemented | Lazy loading, accessible fallback and approved semantics first |

External sources are adopted for a concrete unmet need and retain Estudisc identity. shadcn, dnd-kit, React Flow and MapLibre are not blanket installation requirements.

Phase 3 additions (EXPERIMENTAL/default-off): `RoutinePlanner` and `RoutineWeekView` in `src/features/study-sessions/`. They consume the shared native controls/Tabs, canonical tokens and authoritative routine DTO. Their budgets are planned time, never measured elapsed time or mastery.
