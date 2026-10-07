# Estudisc — Design System Evolution

# 1. Strategy

Do not replace the current Design System.

Evolve it.

Preserve the current identity and improve:
- mobile-first behavior;
- semantic states;
- learning components;
- interaction patterns;
- AI presentation;
- accessibility;
- motion.

# 2. Typography

Keep:
- Archivo;
- JetBrains Mono.

Roles:
- Display;
- PageTitle;
- SectionTitle;
- CardTitle;
- Body;
- Supporting;
- Metadata.

Use Mono mainly for:
- scores;
- duration;
- technical data;
- code.

# 3. Spacing

Suggested initial tokens:

```text
page-inline: 16px
page-inline-large-phone: 20px

section-gap: 28–32px
card-padding: 16px

xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
```

# 4. Semantics

Separate:
- Card;
- ListItem;
- Section;
- Inset;
- Callout.

Do not wrap everything in cards.

# 5. Buttons

Primary
Secondary
Ghost

Keep variants limited.

# 6. Mobile overlays

Prefer Bottom Sheet for:
- quick edits;
- filters;
- concept details;
- AI explanations;
- planner settings.

# 7. Motion tokens

```text
instant: 80–100ms
fast: 120–140ms
standard: 160–200ms
educational: content-dependent
```

Respect reduced motion.

# 8. State tokens

Need semantic roles for:

```text
background
surface
surfaceRaised
surfaceMuted

textPrimary
textSecondary
textMuted

border
borderStrong

interactive
success
warning
danger
information

masteryUnknown
masteryLearning
masteryStrong
masteryReview

subjectMath
subjectPortuguese
subjectScience
subjectHumanities
```

Never communicate a state only by color.

# 9. Component Registry

Create internal registry with statuses:

```text
FOUNDATION
APPROVED
EXPERIMENTAL
```

Before creating a component:
1. search registry;
2. search current project;
3. inspect approved external sources;
4. create only if needed.

# 10. Approved sources

Foundation:
- shadcn/ui;
- existing primitives;
- Motion.

Specialized:
- dnd-kit;
- React Flow;
- MapLibre GL JS.

Inspiration/source:
- React Bits;
- Motion Primitives;
- Magic UI;
- Aceternity.

# 11. External component rule

External visual identity must not leak into the product.

All adopted components must use:
- Estudisc tokens;
- Estudisc typography;
- Estudisc states;
- Estudisc accessibility;
- Estudisc motion rules.

# 12. Avoid

Unless functionally justified:
- shader backgrounds;
- custom cursors;
- glassmorphism;
- continuous glow;
- parallax 3D;
- particle backgrounds;
- landing-page animations;
- decorative WebGL.

# 13. Mobile shell

Primary navigation:
- Hoje;
- Plano;
- Aprender;
- Revisar;
- Progresso.

Focus Mode removes bottom nav.

# 14. Accessibility

Minimum:
- 44px touch targets;
- visible focus;
- keyboard support;
- semantic HTML;
- reduced motion;
- proper contrast;
- alt text;
- drag alternatives.
