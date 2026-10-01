# 20 — Product Acceptance Criteria

## IFSC completion gate

Audit [IFSC acceptance criteria](ifsc/17-ACCEPTANCE-CRITERIA.md) in addition to core criteria. Full coverage requires every authoritative Anexo V requirement, zero unmapped requirements, validated mappings and planner-ready content/question coverage. Mobile-first flows and golden regression fixtures are required. Compiling alone is not completion.

## Global

- Keyboard-only use supports all primary flows.
- State never depends only on color.
- Content and user state remain separate.
- Errors preserve recoverable user work.
- Autosave communicates saving/saved/error states without unnecessary manual save actions.
- Responsive behavior follows recomposition rules in the Design System.

## Lesson

- Displays ordered blocks with stable navigation.
- Restores the user's last position.
- Shows navigation/completion progress separately from concept mastery.
- Does not equate lesson completion with concept mastery.

## Programming activity

- RUN executes without recording an Attempt.
- SUBMIT validates and records exactly one Attempt.
- stdout, stderr, test results and timeout states are understandable.
- Runtime cannot access the application DOM or secrets.

## Import

- Invalid Packs cause no mutation.
- Same version is idempotent.
- Updates show a preview and preserve user data.
- Conflicts prevent application.

## History

- Relevant events appear in chronological order.
- Attempt history remains available after content updates.

## Review

- Due concepts are selected by documented rules.
- Completion updates the next review date.
- The user can see why a concept is due.
