# Estudisc — AI Learning Layer

# 1. Principle

AI is a contextual learning assistant.

It is not the deterministic learning engine.

# 2. Approved capabilities

```ts
explainDifferently()
giveHint()
analyzeMistakes()
summarizeSession()
explainConceptRelation()
```

# 3. Forbidden authority

AI must not be authoritative over:
- mastery;
- spaced repetition;
- planner;
- recommendation ordering;
- simulation scoring;
- evidence;
- editorial publication.

# 4. Suggested architecture

```text
src/features/ai/
  ai-service.ts
  providers/
  prompts/
  schemas/
  context/
  cache/
  usage/
```

# 5. Provider abstraction

```ts
interface AIService {
  explainDifferently(input: ExplainInput): Promise<Explanation>;
  giveHint(input: HintInput): Promise<Hint>;
  analyzeMistakes(input: MistakeInput): Promise<MistakeAnalysis>;
  summarizeSession(input: SessionInput): Promise<SessionSummary>;
  explainConceptRelation(input: RelationInput): Promise<ConceptRelation>;
}
```

# 6. Minimal context

Example:

```ts
interface StudentLearningContext {
  conceptIds: string[];
  learningObjective?: string;
  currentMastery?: string;
  currentBlock?: string;
  currentQuestion?: string;
  relatedMistakes?: MistakeSummary[];
  assistanceLevel?: number;
}
```

Do not send the full user history.

# 7. Cost controls

Use:
- small contexts;
- cache;
- structured outputs;
- inexpensive models for simple tasks;
- strong-model escalation only when necessary;
- rate limits;
- usage logging.

# 8. Explain Differently

UI action:

```text
[ Explicar de outro jeito ]
```

Return:
- concise explanation;
- optional analogy;
- optional example;
- no unrelated content.

# 9. Help Levels

1. small hint;
2. concept recall;
3. analogous example;
4. step-by-step.

The system must record help usage.

# 10. Mistake Analysis

AI may summarize patterns after deterministic grouping.

It should not invent mistakes that are not supported by attempts.

# 11. Session Summary

Use structured session facts first.

AI only turns them into concise language.

# 12. Failure

If AI fails:
- learning continues;
- UI displays recoverable error;
- no session is blocked.

# 13. Safety

Never send:
- auth secrets;
- cookies;
- provider keys;
- unnecessary personal data;
- unrelated user history.

# 14. Testing

Test:
- schema validation;
- missing provider;
- timeout;
- invalid response;
- fallback;
- cache;
- usage logging.
