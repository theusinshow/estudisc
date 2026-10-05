# PROMPT — APLICAR VECTA SCIENCE CONTENT V2

Você está no repositório REAL do VECTA. Recebeu a pasta `VECTA-SCIENCE-CONTENT-v2`.

Seu papel é **integração técnica e QA**, não autoria editorial.

## REGRAS INEGOCIÁVEIS
- NÃO pesquise conteúdo novo.
- NÃO regenere aulas.
- NÃO reescreva explicações, questões, alternativas ou gabaritos.
- NÃO invente Concept IDs.
- NÃO publique LIVE automaticamente.
- NÃO descarte proveniência/sourceRefs.
- NÃO substitua `DETERMINISTIC_ASSET` por imagem generativa.
- Se houver incompatibilidade de schema, adapte via mapper/importer e reporte qualquer perda semântica.

## LEIA PRIMEIRO
- `IMPORT-MANIFEST.json`
- `SCIENCE-CURRICULUM-MAP.json`
- `SCIENCE-SOURCE-LIBRARY.json`
- `SCIENCE-COVERAGE-REPORT.md`
- `APPLY-TO-VECTA.md`
- `MEDIA-PRODUCTION/VISUAL-SYSTEM.md`
- `MEDIA-PRODUCTION/ANTIGRAVITY-QUEUE.json`
- `MEDIA-PRODUCTION/DETERMINISTIC-ASSET-QUEUE.json`

Depois leia `workspace/CIE-01` … `workspace/CIE-40`.

## INSPEÇÃO DO REPOSITÓRIO
Antes de modificar código, descubra:
1. schema real de Lesson;
2. block renderer e tipos suportados;
3. Question Bank;
4. Concept/Mastery model;
5. catálogo de currículo;
6. media/assets;
7. importer/admin/seeds;
8. testes de conteúdo;
9. convenções de IDs/versionamento;
10. como Matemática foi integrada.

Crie `SCIENCE-INTEGRATION-PLAN.md` com o mapping encontrado e continue sem pedir confirmações rotineiras.

## CONCEPTS
`CIE-XX-CON-*` são IDs editoriais do pacote.

Para cada um:
- procure equivalência real no VECTA;
- reuse Concept existente quando semanticamente equivalente;
- crie somente se necessário e de acordo com o schema real;
- salve `SCIENCE-CONCEPT-MAP.json`.

Nunca colapse conceitos diferentes apenas porque os nomes parecem semelhantes.

## BLOCKS
O pacote usa blocos como:
- HOOK
- LEARNING_GOALS
- EXPLANATION
- CALLOUT
- WORKED_EXAMPLE
- MEDIA_RECOMMENDATION
- IMAGE_REQUEST
- DETERMINISTIC_COMPONENT_REQUEST
- SUMMARY
- EXIT_TICKET

Reutilize componentes existentes. Se o renderer não suportar um bloco, crie um adapter simples; não invente um novo mini-framework.

## QUESTIONS
Existem **320 MCQs originais**, 8 por aula.

Valide:
- IDs únicos;
- exatamente A–E;
- exatamente uma `correctOption`;
- explicação preservada;
- concept refs resolvidas;
- difficulty/cognitiveOperation preservados quando o schema suportar.

Não altere um gabarito silenciosamente.

## MEDIA
### Imagens
Use `MEDIA-PRODUCTION/PROMPT-ANTIGRAVITY-BATCH.md` apenas se Antigravity estiver disponível.
Não é obrigatório gerar as imagens durante a primeira importação.

Toda imagem gerada começa com:
`factualReviewStatus = PENDING`.

### Componentes determinísticos
Use `MEDIA-PRODUCTION/PROMPT-DETERMINISTIC-ASSETS.md`.

Pilotos prioritários:
- CIE-06 circuito;
- CIE-07 cálculo de consumo;
- CIE-10 átomo Z/A/p/n/e;
- CIE-18 mitose/meiose;
- CIE-25 Punnett;
- CIE-31 visão;
- CIE-38 Terra/Lua;
- CIE-40 evolução estelar.

## IMPORTAÇÃO SEGURA
- idempotente;
- draft/preview primeiro;
- sem escrita destrutiva em produção;
- reexecução sem duplicações;
- feature flag/status quando disponível.

## AULAS-PILOTO
Renderize e teste primeiro:
CIE-04, CIE-10, CIE-18, CIE-22, CIE-30, CIE-33, CIE-38, CIE-40.

Teste mobile e desktop, progresso, mastery, media fallback e question rendering.

## TESTES OBRIGATÓRIOS
- 40 lessons;
- 320 questions;
- 240 editorial Concepts antes do reconciliation;
- sourceRefs resolvidos;
- question IDs únicos;
- 5 opções por MCQ;
- uma correta por MCQ;
- concept mapping completo;
- nenhum overflow importante em mobile nas aulas-piloto;
- nenhuma regressão em Matemática;
- import idempotente.

## SAÍDA
Entregue:
1. `SCIENCE-INTEGRATION-PLAN.md`;
2. `SCIENCE-CONCEPT-MAP.json`;
3. relatório de importação;
4. componentes reutilizados/criados;
5. testes e resultados;
6. assets ainda PENDING;
7. incompatibilidades editoriais encontradas.

Critério de sucesso:
- CIE-01…CIE-40 disponíveis em preview/draft;
- 320 questões válidas;
- 100% do currículo mapeado;
- Matemática intacta;
- nada LIVE automaticamente;
- reimport seguro e idempotente.

COMECE AGORA E SIGA ATÉ CONCLUIR. NÃO PARE PARA PEDIR CONFIRMAÇÃO EM ETAPAS ROTINEIRAS.
