# Aplicação do pacote VECTA Science V2

## Objetivo
Integrar CIE-01…CIE-40 no VECTA sem regenerar o conteúdo editorial.

## Ordem
1. Leia `IMPORT-MANIFEST.json`.
2. Leia `SCIENCE-CURRICULUM-MAP.json`.
3. Leia `SCIENCE-SOURCE-LIBRARY.json`.
4. Leia `MEDIA-PRODUCTION/README.md`.
5. Inspecione o schema real e as aulas de Matemática já integradas.
6. Crie um mapper/importer idempotente.
7. Reconcile Concepts.
8. Importe as oito aulas-piloto em preview/draft.
9. Valide renderer, question bank, mastery e mobile.
10. Só então importe as demais.

## Conteúdo
Cada `workspace/CIE-XX` contém pesquisa, autoria, QA e `approved/pack.json`.

A versão a importar é **version 2**.

## Assets
- imagens generativas: `MEDIA-PRODUCTION/ANTIGRAVITY-QUEUE.json`
- componentes exatos: `MEDIA-PRODUCTION/DETERMINISTIC-ASSET-QUEUE.json`

A falta de um asset visual não deve bloquear a importação editorial; mantenha placeholder/fallback explícito.

## Não fazer
- não pesquisar;
- não reescrever aulas;
- não trocar gabaritos;
- não duplicar Concepts existentes;
- não promover conteúdo para LIVE automaticamente;
- não usar imagem generativa como substituto de diagramas científicos exatos.
