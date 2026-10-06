# Estudisc — Sistema de Componentes

## Delta IFSC integrado


Required learning components/variants:

- `StudySessionCard`
- `SessionProgress`
- `LessonHeader`
- `LearningSurface`
- `WorkedExample`
- `HintPanel`
- `FeedbackPanel`
- `QuestionShell`
- `AnswerChoice`
- `NumericAnswer`
- `TextHighlightActivity`
- `OrderingActivity`
- `ClassificationActivity`
- `NumericExplorer`
- `TimelineActivity`
- `DiagramActivity`
- `MasteryIndicator`
- `RetentionStatus`
- `ReviewCard`
- `AssessmentTimer`
- `QuestionNavigator`
- `TutorSheet`

## Mechanical press behavior

Pressable surfaces should visually depress using existing motion/shadow tokens:

default → hard offset shadow
active → short translate + reduced shadow

Respect `prefers-reduced-motion`.

## Touch

Primary buttons generally use at least the existing 44px minimum hit target; learning answers often benefit from 52–56px or more depending on content.

## Content rule

Do not wrap every prose paragraph in a bordered card. Structural emphasis belongs on actionable/meaningful surfaces.


## Contrato global

Todo componente consome `design-tokens.json`. Valores literais locais são
proibidos. Raio base entre 0 e 4px; superfícies de aprendizagem e sheets usam os tokens canônicos de 12–18px. Borda explícita, sombra sólida e foco visível.

## Ação

### Button

Variantes: `primary`, `secondary`, `ghost`, `destructive`, `machine`.

- `primary`: uma por contexto de decisão.
- `secondary`: ação relevante sem competir com a primária.
- `ghost`: ação de baixa ênfase.
- `destructive`: requer rótulo explícito e, quando irreversível, confirmação.
- `machine`: ação dentro de superfície técnica escura.

Estados: default, hover, focus-visible, active, disabled, loading.

### IconButton

Usa Lucide na geometria original. Em desktop pode ter superfície visual compacta,
mas a área clicável respeita o token de alvo mínimo. Abaixo de 1200px o hit area
é sempre pelo menos 44px. Todo IconButton precisa de nome acessível e tooltip.

### Toggle / Segmented control

O item selecionado usa texto, posição e marca visual; nunca apenas cor.

## Entrada

`Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch` e `SearchInput`.

- Archivo para dados textuais comuns.
- JetBrains Mono apenas quando o conteúdo for código, comando, identificador ou metadado técnico.
- Mensagem de validação vinculada por `aria-describedby`.
- Checkbox mantém forma quadrada; a marca deve permanecer reconhecível em escala de cinza.

## Informação

- `TechnicalLabel`: JetBrains Mono, uppercase, usado com moderação.
- `Badge`: estado curto; sempre contém texto.
- `Status`: ícone + texto + tratamento de superfície.
- `MasteryIndicator`: glifo, rótulo e escala de 0 a 5.
- `XPIndicator`: progresso de esforço; nunca compartilha barra com Mastery.
- `RankIndicator`: rank, tier e progresso, separado de evidência pedagógica.

## Estrutura

`Panel`, `Surface`, `MachineSurface`, `Divider`, `Tabs`, `Sidebar`, `Topbar`,
`Statusbar`, `CommandPalette`, `Table`, `RecordList`, `EmptyState` e `StateBanner`.

## Lesson Blocks

Tipos iniciais:

`TEXT`, `CONCEPT`, `NOTE`, `WARNING`, `CODE`, `TERMINAL`, `DIAGRAM`,
`COMPARISON`, `EXAMPLE`, `PROJECT`, `INTERACTIVE`, `QUIZ`, `CHALLENGE`,
`EXERCISE`, `DEBUG`, `PREDICTION`, `CHECKPOINT`, `SUMMARY`.

A identidade de cada bloco combina label, anatomia e borda; não usa fundo
colorido indiscriminadamente.

## ActivityShell

Slots obrigatórios:

- header: tipo, id e metadados;
- context: projeto ou origem, opcional;
- prompt;
- renderer;
- actions;
- feedback “o que aconteceu” + “por quê”;
- evidence: atualização pedagógica após SUBMIT.

Renderers: Prediction, Quiz, Code, Debug, Complete, Explain e Project Challenge.

## Overlays

- Command Palette: busca/ação global.
- Modal: decisão bloqueante curta.
- Drawer: contexto secundário.
- Toast: confirmação transitória, nunca única fonte de informação crítica.
- Tooltip: explicação breve; não recebe conteúdo indispensável.

Modais e drawers prendem foco; o restante da página recebe `inert` enquanto ativos.
