# Estudisc — Product, Learning & Design Architecture

> Status: arquitetura aprovada para implementação.
> Produto: Estudisc.
> Abordagem: evolução incremental da base atual. Não reescrever o produto.

# 1. Visão

O ciclo principal deve ser:

```text
PLANO
  ↓
HOJE
  ↓
SESSÃO
  ↓
AULA INTERATIVA
  ↓
PRÁTICA
  ↓
EVIDÊNCIA
  ↓
MASTERY
  ↓
REVISÃO / ERROS
  ↓
NOVA RECOMENDAÇÃO
  ↓
PLANO ADAPTADO
```

O Estudisc não deve virar clone do Duolingo, LMS tradicional, dashboard SaaS, chatbot com aulas, catálogo de cursos ou showcase de animações.

# 2. Princípios

- Mobile-first real.
- Próxima ação acima de dashboard.
- Usuário controla a rotina; Estudisc decide o melhor uso pedagógico do tempo.
- Evidência antes de gamificação.
- Interatividade com função.
- Progressive enhancement: conteúdo → visual → interação → IA.
- IA contextual, nunca núcleo de mastery/planner.
- Acessibilidade e reduced motion obrigatórios.
- Componentes reutilizáveis antes de componentes específicos por aula.

# 3. Navegação principal

Mobile:

```text
Hoje
Plano
Aprender
Revisar
Progresso
```

Perfil/configurações ficam no avatar.

Simulados, Knowledge Map e Caderno de Erros ficam dentro das áreas apropriadas.

# 4. Shell mobile

```text
TopBar
Content
BottomNavigation
```

Focus Mode remove Bottom Navigation.

Desktop expande a mesma arquitetura para Sidebar + Content.

# 5. Home / Hoje

A rota `/` representa Hoje.

Primeira viewport em ~390×844 deve priorizar:

```text
Estudisc

Boa tarde, João
Terça, 6 de outubro

PRÓXIMO PASSO

Revisar Porcentagem

Você teve dificuldade neste conceito
e ele será usado novamente.

8 questões · ~12 min

[ Começar revisão ]

Plano de hoje                    42 min

01 Revisão                      10 min
   Porcentagem

02 Aula                         18 min
   Regra de três
```

Depois:
- Precisa da sua atenção;
- Esta semana;
- Seu aprendizado;
- Matérias;
- Simulado, quando relevante.

## StudyActionCard

Variantes:

```text
review
continue
lesson
practice
quick-review
simulation
```

Sempre incluir motivo legível.

# 6. Study Planning System

O Planner é página própria.

Princípio:

> O usuário organiza o tempo. O Estudisc organiza o aprendizado dentro desse tempo.

Onboarding:
1. dias;
2. tempo;
3. prioridades;
4. preview.

Modos:
- Automatic;
- Assisted (recomendado);
- Manual.

Week View mostra orçamento de tempo por matéria, não questões específicas.

Routine View controla disponibilidade, prioridade, horários, política de revisão e simulado.

Suportar:
- mudanças temporárias;
- redistribuição de dias perdidos;
- auto rebalance com preview;
- foco temporário.

# 7. Adaptive Study Session

O aluno pode declarar 10/20/30/45 min.

O motor compõe a melhor sessão considerando:
1. sessão interrompida;
2. revisão vencida;
3. mastery baixo;
4. erros;
5. pré-requisitos;
6. currículo;
7. tempo;
8. atividades incompletas;
9. prioridades do Planner.

O motor deve ser determinístico e testável.

# 8. Aula / Focus Mode

Aula:

```text
Lesson
  └ Section
      └ LessonStep
          └ LearningBlock[]
```

LessonStep trabalha uma ideia principal.

Exemplos:
- Hook;
- Prediction;
- Explanation;
- Demonstration;
- Explore;
- Practice;
- Feedback;
- Checkpoint.

Sem Bottom Navigation durante a aula.

# 9. Interactive Learning Engine

Blocos possíveis:

```text
text
callout
image
diagram
question
flashQuestion
prediction
reveal
matching
sorting
dragDrop
hotspot
timeline
interactiveMap
comparison
slider
chart
stepAnimation
simulation
formulaPlayground
geometryCanvas
checkpoint
```

Não implementar todos imediatamente.

Propósitos:

```text
demonstration
exploration
practice
assessment
```

Exploration não deve gerar mastery forte.

# 10. Prediction Pattern

```text
PREVER
  ↓
OBSERVAR
  ↓
EXPLICAR
  ↓
PRATICAR
```

# 11. Modo Estou Travado

Níveis:
1. pequena pista;
2. relembrar conceito;
3. exemplo semelhante;
4. passo a passo.

Registrar ajuda usada e reduzir peso da evidência.

# 12. Explica de outro jeito

IA contextual, inline ou bottom sheet.

Não abrir chatbot genérico.

# 13. Pause / Resume

Persistir:
- lessonId;
- version;
- step;
- interaction state;
- answers;
- elapsed time;
- scroll quando necessário.

# 14. Visual Learning Asset System

Tipos:

```text
photo
illustration
diagram
map
comparison
sequence
question-asset
interactive-image
```

Todo asset deve possuir finalidade pedagógica.

Asset Registry deve conter:
- id;
- type;
- title;
- subjects;
- concepts;
- tags;
- source/license;
- alt;
- reusable;
- interactiveReady.

# 15. Mapas

Base recomendada: MapLibre GL JS.

Criar abstração `InteractiveMap`.

Suportar:
- GeoJSON;
- layers;
- regiões;
- hotspots;
- selection;
- identify;
- exploration;
- time slider futuramente.

# 16. Knowledge Map

Base recomendada: React Flow.

Estados:

```text
○ Não estudado
◐ Em desenvolvimento
✓ Consolidado
! Precisa revisar
```

Mobile abre subgrafos por matéria e detalhes em bottom sheet.

# 17. Aprender

Arquitetura:

```text
APRENDER
├ Search
├ Subjects
│  └ Subject
│     ├ Continue
│     ├ Concepts
│     ├ Lessons
│     ├ Knowledge Map
│     └ Explorers
└ Concept
   ├ Mastery
   ├ Lessons
   ├ Practice
   ├ Mistakes
   └ Related concepts
```

# 18. Revisar

Primeira viewport:
- revisão principal;
- Quick Review;
- conceitos que precisam atenção.

Review Engine usa:
- recência;
- mastery;
- dificuldade;
- erros;
- pré-requisitos;
- simulado;
- ajuda usada;
- importância curricular.

# 19. Smart Mistake Notebook

Não listar apenas questões erradas.

Agrupar padrões.

Categorias internas:

```text
concept_gap
procedure_error
misconception
attention_error
interpretation_error
calculation_error
prerequisite_gap
```

Fluxo:

```text
ERRO
↓
PADRÃO
↓
EXPLICAÇÃO
↓
EXEMPLO
↓
NOVA TENTATIVA
↓
NOVA EVIDÊNCIA
```

# 20. Progresso

Responder:
- o que domino;
- onde estou evoluindo;
- onde estou travado;
- o que está me segurando.

Evitar BI pesado.

# 21. Simulado Real

Focus Mode separado.

Sem:
- IA;
- hints;
- feedback imediato;
- mastery visível.

Com:
- timer;
- navegação;
- questões marcadas;
- revisão final;
- análise posterior.

Erros retornam ao sistema normal de review/mastery.

# 22. Session Summary

Ao final da sessão:

```text
32 min

✓ 1 aula
✓ 11 questões
✓ 3 conceitos revisados

Fortaleceu
Porcentagem ↑

Precisa atenção
Interpretação textual

Próximo passo
Regra de três
```

# 23. AI Learning Layer

IA pode:
- explainDifferently();
- giveHint();
- analyzeMistakes();
- summarizeSession();
- explainConceptRelation().

IA não controla:
- Planner;
- mastery;
- spaced repetition;
- simulado;
- evidência;
- publicação.

# 24. Lesson Blueprint Pipeline

Antes de enriquecer 132 aulas, gerar blueprint por aula.

Exemplo:

```yaml
lesson: porcentagem-introducao
concepts:
  - porcentagem
learning_goal:
  Entender porcentagem como parte de um todo.
common_mistakes:
  - confundir percentual com valor absoluto
archetypes:
  - concept
  - simulation
recommended_blocks:
  - prediction
  - explanation
  - slider
  - practice
  - checkpoint
visual_needs:
  - percentage-diagram
interaction_level: 2
```

# 25. Interactivity levels

Level 1:
- text;
- image;
- example;
- question;
- feedback.

Level 2:
- prediction;
- matching;
- timeline;
- hotspot;
- drag;
- slider.

Level 3:
- simulation;
- advanced map;
- interactive chart;
- specialized manipulative.

# 26. Pipeline eficiente de IA

```text
132 Lessons
↓
Local Extractor
↓
Compact Summaries
↓
Deterministic Rules
↓
Clustering
↓
Archetypes
↓
Low-cost AI Review
↓
Confidence Score
↓
Strong Model only for exceptions
↓
Blueprints
```

Cada blueprint armazena `sourceHash` e `blueprintVersion`.

Sem mudança de hash: SKIP.

# 27. Design System

Evoluir o atual. Não redesenhar do zero.

Preservar:
- Archivo;
- JetBrains Mono;
- bordas explícitas;
- linguagem atual;
- aparência de ferramenta.

Criar source of truth única de versão.

# 28. Component Registry

FOUNDATION:
- Button;
- Input;
- Sheet;
- Dialog;
- Tabs;
- Progress;
- Tooltip;
- SegmentedControl;
- TopBar;
- BottomNavigation.

STUDY:
- StudyActionCard;
- StudyPlanItem;
- SessionPlan;
- SessionProgress;
- SessionSummary;
- QuickReview.

LEARNING:
- LessonStep;
- LessonImage;
- Prediction;
- Matching;
- Sorting;
- Hotspot;
- Timeline;
- Comparison;
- SliderSimulation;
- InteractiveMap;
- Checkpoint.

MASTERY:
- ConceptStatus;
- MasteryIndicator;
- KnowledgeNode;
- MistakePattern;
- ReviewItem.

AI:
- AIExplanation;
- HintPanel;
- HelpLevel;
- ExplainRelation.

ASSESSMENT:
- QuestionNavigation;
- ExamTimer;
- ExamQuestion;
- ExamSummary.

DATA:
- AnimatedMetric;
- SimpleTrend;
- ProgressBar.

# 29. Component sourcing

Foundation:
- shadcn/ui;
- primitives existentes;
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

Regra:
> código/padrão pode entrar; identidade visual externa não.

# 30. Admin Authoring

Depois que runtime estiver estável:
- Add Block;
- Preview mobile;
- Asset Library;
- Blueprint viewer;
- Content Health;
- Accessibility checks;
- publication semantics.

# 31. Feature flags

Grandes frentes devem ser introduzidas progressivamente:

```text
FEATURE_NEW_TODAY
FEATURE_STUDY_PLANNER
FEATURE_ADAPTIVE_SESSION
FEATURE_INTERACTIVE_LESSONS
FEATURE_AI_LEARNING
FEATURE_KNOWLEDGE_MAP
FEATURE_SMART_MISTAKES
FEATURE_REAL_EXAM
FEATURE_CONTENT_HEALTH
```

# 32. Dados

Abordagem additive-first.

Novas estruturas podem incluir:
- study plans;
- schedule overrides;
- lesson blueprints;
- interactive blocks;
- asset metadata;
- AI usage;
- mistake clusters;
- publication mode;
- session summaries.

Preservar stable IDs.

# 33. Fases

0. Stabilization
1. Design Foundation
2. Today
3. Study Planner
4. Adaptive Session
5. Lesson Architecture
6. Core Interactive Blocks
7. Visual Asset System
8. Lesson Blueprint Pipeline
9. Content Enrichment
10. Review & Mistakes
11. AI Learning Layer
12. Knowledge Map
13. Real Exam Mode
14. Admin Authoring
15. Offline / Advanced Experiences

# 34. Regra final

O aluno não deveria pensar:

> Qual aula eu deveria abrir?

O Estudisc deve ajudá-lo a chegar a:

> Tenho 30 minutos. O que preciso fazer?

E responder com uma sessão coerente, visual, interativa e adaptativa.
