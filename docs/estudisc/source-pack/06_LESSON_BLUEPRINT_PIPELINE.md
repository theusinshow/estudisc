# Estudisc — Lesson Blueprint Pipeline

# 1. Objective

Define what each lesson should become before implementing interactive enrichment.

Do not send all complete lessons to a strong model.

# 2. Local extraction

Generate compact metadata per lesson:

```json
{
  "id": "geo-biomas-brasil",
  "title": "Biomas brasileiros",
  "subject": "geography",
  "concepts": ["biomas", "clima", "vegetacao"],
  "objectives": ["Identificar os principais biomas"],
  "existingBlocks": ["text", "question"],
  "wordCount": 1200
}
```

# 3. Deterministic candidate generation

Examples:

```text
geography + location
→ interactiveMap

history + dates
→ timeline

math + numeric variable
→ slider

science + process
→ stepAnimation

grammar + classification
→ matching

text interpretation
→ text selection
```

# 4. Clustering

Group lessons before strong analysis.

Example clusters:
- percentages/proportions;
- geometry;
- grammar;
- interpretation;
- spatial geography;
- biological processes;
- historical chronology.

# 5. Blueprint

```yaml
lesson: geo-biomas-brasil

concepts:
  - biomas
  - clima
  - vegetacao

learning_goal:
  Identificar e comparar os principais biomas brasileiros.

common_mistakes:
  - confundir bioma com clima
  - associar bioma apenas a vegetacao

archetypes:
  - spatial
  - comparison

recommended_blocks:
  - image
  - interactiveMap
  - matching
  - checkpoint

visual_needs:
  - brazil-biomes-map
  - cerrado-photo
  - amazonia-photo

interaction_level: 2

confidence: 0.91
needsDeepReview: false
```

# 6. Confidence escalation

Example:

```text
confidence >= 0.70
→ normal review

confidence < 0.70
→ strong model review
```

Also escalate:
- custom simulation;
- complex diagram;
- ambiguous learning goal;
- conflicting prerequisites.

# 7. Incremental behavior

Every blueprint stores:
- sourceHash;
- blueprintVersion;
- generatedAt;
- reviewState.

If sourceHash unchanged:
- skip.

# 8. Deliverables

The pipeline must output:
- one blueprint per lesson;
- aggregate report;
- interaction frequency;
- asset needs;
- low-confidence list;
- reusable component opportunities.

# 9. Aggregate report example

```text
132 lessons analyzed

Level 1: X
Level 2: X
Level 3: X

Needs image: X
Needs diagram: X
Needs map: X
Needs timeline: X
Needs simulation: X
Needs deep review: X
```

# 10. Critical rule

The Blueprint Pipeline audits first.

It must NOT automatically rewrite/publish all lessons in the same run.
