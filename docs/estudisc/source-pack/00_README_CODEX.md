# Estudisc — Codex Execution Pack

Este pacote contém a arquitetura aprovada e os documentos operacionais necessários para executar a próxima evolução do Estudisc com Codex.

## Ordem obrigatória de leitura

1. `01_PRODUCT_ARCHITECTURE.md`
2. `02_CODEX_MASTER_PROMPT.md`
3. `03_IMPLEMENTATION_GAP_ANALYSIS_TEMPLATE.md`
4. `04_IMPLEMENTATION_PLAN_TEMPLATE.md`
5. `05_INTERACTIVE_LEARNING.md`
6. `06_LESSON_BLUEPRINT_PIPELINE.md`
7. `07_AI_LEARNING_LAYER.md`
8. `08_DESIGN_SYSTEM_EVOLUTION.md`
9. `09_ACCEPTANCE_AND_QA.md`
10. `10_EXECUTION_CHECKLIST.md`

## Regra principal

Não implementar tudo de uma vez.

A ordem de execução é:

1. Auditar o repositório contra a arquitetura.
2. Gerar `IMPLEMENTATION-GAP-ANALYSIS.md`.
3. Gerar `IMPLEMENTATION-PLAN.md`.
4. Estabilizar o que já existe.
5. Implementar por fases.
6. Rodar lint, typecheck, testes e build ao final de cada fase.
7. Não migrar em massa as 132 aulas antes do Lesson Blueprint Pipeline.
8. Não fazer rewrite da stack.
9. Não substituir motores determinísticos por IA.
10. Preservar conteúdo, IDs, evidências, mastery, histórico e compatibilidade.

## Arquivos que o Codex deve criar no repositório

Sugestão:

```text
docs/estudisc/
  PRODUCT_ARCHITECTURE.md
  IMPLEMENTATION-GAP-ANALYSIS.md
  IMPLEMENTATION-PLAN.md
  INTERACTIVE-LEARNING.md
  LESSON-BLUEPRINTS.md
  AI-LEARNING.md
  DESIGN-SYSTEM.md
  QA-ACCEPTANCE.md
```

## North Star

> O Estudisc é um sistema pessoal de estudo adaptativo que transforma disponibilidade, currículo e evidência de aprendizagem em uma rotina prática, visual, interativa e personalizada.
