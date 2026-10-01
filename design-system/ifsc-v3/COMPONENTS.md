# Learning Components v3

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
