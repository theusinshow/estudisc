# Estudisc — Interactive Learning Engine

# 1. Objective

Transform lessons from mostly passive content into structured learning experiences using reusable blocks.

Interactivity must serve pedagogy.

# 2. Block model

```ts
type LearningPurpose =
  | "demonstration"
  | "exploration"
  | "practice"
  | "assessment";

interface LearningBlockBase {
  id: string;
  type: string;
  purpose: LearningPurpose;
  conceptIds: string[];
}
```

# 3. Priority blocks

## Prediction

Use before demonstration when useful.

Flow:

```text
Prediction
→ Observe
→ Explanation
→ Practice
```

## Image

Variants:
- photo;
- illustration;
- diagram;
- sequence.

## Matching

Must support tap-to-pair, not drag only.

## Sorting

Must support buttons/keyboard in addition to drag.

## Timeline

Vertical-first on mobile.

## Comparison

Slider plus accessible show-before/show-after controls.

## Hotspot

Large targets and zoom support.

## SliderSimulation

Variable manipulation with immediate visual outcome.

## InteractiveMap

MapLibre-based.

# 4. Feedback

Components:
- CorrectFeedback
- IncorrectFeedback
- PartialFeedback
- ExplanationFeedback

Feedback must teach, not just grade.

# 5. Evidence

Examples:

```text
exploration → no strong evidence
prediction → light diagnostic signal
practice → normal evidence
checkpoint → stronger evidence
```

Hints reduce evidence weight.

# 6. Assistance

`Estou travado` levels:
1. hint;
2. recall;
3. analogous example;
4. step-by-step.

Persist help usage.

# 7. Motion

Motion is permitted when it explains:
- sequence;
- transformation;
- causality;
- spatial relationship.

Decorative continuous motion is discouraged.

# 8. Accessibility

Every interactive block must define:
- keyboard path;
- mobile touch path;
- non-drag fallback;
- reduced motion;
- labels;
- screen-reader semantics;
- error state;
- loading state.

# 9. Runtime failure

If an advanced block fails:
- lesson stays usable;
- text/image fallback is shown where possible;
- error is recoverable.

# 10. Component rule

Prefer generic:

```text
InteractiveMap
Timeline
SliderSimulation
HotspotImage
Comparison
```

over subject-specific component names.

Subject-specific information belongs in content data.
