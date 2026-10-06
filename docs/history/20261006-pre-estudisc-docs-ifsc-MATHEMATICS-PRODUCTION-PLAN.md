# Produção completa de Matemática para revisão humana

## Entrega concluída em 2026-10-04

Os dezenove rascunhos (MAT-01 a MAT-18 e MAT-PREREQ) passaram em QA independente real e aceite dos hashes atuais:106Concepts canônicos,240Questions e57exitQuestions. Pesquisa selada19/19 e relatórios atuais de todos os blocos a343px sem overflow. A revisão extra de MAT18 fechou a ambiguidade de Q06, explicitando azul e verde sem antecipar as frequências.

Entrega local: [índice e manuscritos](../../.local/mathematics-production/review/INDEX.md), [aceite final](../../.local/mathematics-production/review/acceptance.json) e [comandos/resultados](../../PLANS.md). Os caminhos locais continuam Git-ignorados; preservar os arquivos no checkout para revisão humana. Todos os jobs estão HUMAN_REVIEW_REQUIRED, com QA APPROVED e nenhum claim ativo. Permanecem visíveis as ressalvas de correspondência oficial, direitos das fontes e estimativas de duração; rascunhos não são currículo publicado/pronto para planner.

Lint/typecheck/build e219testes passaram (3ignorados). E2E completo:19passaram/15falharam; a aplicação continua sem aceite de release. Nenhuma aprovação humana, exportação/importação, publicação, push ou deploy. NEXT ACTION atual: revisão humana pelo índice, reconciliação das ressalvas antes de promoção autorizada; correções da aplicação em trabalho separado. O Image Producer permanece em standby. Os registros abaixo são históricos e não representam a fila atual.

2026-10-03 12:45 BRT: after actual MAT12 revision2 completion, no active Lupa claim and idle terminal, retargeted the existing Lupa canvas terminal to actual REVIEWER. Footer retained Codex GPT-6-Luna xhigh; old AUTHOR launcher bootstrap explicitly superseded by role and concrete Reviewer handoff. Lupa exclusively reviews unclaimed05/06/10/16/18 (none authored by Lupa); Crivo retains01/02/03/04/08/09; Library retains07/11..15/17/PREREQ. Future Author corrections11..15 transferred exclusively to Trama, which now owns all corrections. Maps/connected notes updated. No new terminal/subagent, self-review, model substitution, active-claim transfer or human approval. First Lupa QA05 is a direct ask session35619, retained as already-queued in its separate router.


Autorização confirmada pelo usuário em 2026-10-02. Escopo: **MAT-01 a MAT-18, mais MAT-PREREQ**, no currículo existente; produção original em rascunho, pesquisa verificável e revisão independente por agentes antes da revisão humana. Não é autorização de publicação, importação em produção, push ou deploy.

## Continuação atual (2026-10-02, 20:49 BRT)

Os dezenove jobs e todos os 106 Concepts já têm pesquisa concluída e auditada contra os hashes reais. Quatorze manuscritos foram entregues, mas a QA/correção está em andamento; este número não significa quatorze aulas prontas. O índice e a contagem atual estão em `.local/mathematics-production/review/INDEX.md` e `status.json`.

Lupa escreve11..15/17; Trama escreve01/02/05/06/07/08/PREREQ e assume futuras correções dos seis manuscritos escritos pela Library(03/04/09/10/16/18). Library agora revisa07/11..15/17/PREREQ; Crivo revisa os outros11. Ninguém revisa a própria autoria nem aprova em nome do humano. O registro exato dos terminais está em `tools/vecta-content-studio/MAESTRI-TEAM.md`.

A entrega exige dezenove snapshots com validação, QA real APPROVED e hashes atuais correspondentes; o estado HUMAN_REVIEW_REQUIRED sozinho também pode significar limite de revisões e não é suficiente. Os manuscritos incluem dicas, soluções, justificativas de alternativas, pontos de checagem e ressalvas. Figuras só aparecem vinculadas ao snapshot da aula que foi realmente renderizado; gráficos textuais mantêm formatação preformatada. Nada foi importado, aprovado pelo humano ou publicado. O Image Producer fica para depois desta entrega.

A estimativa40 dos skeletons novos é fallback editorial de prepare.ts, não duração oficial verificada; entradas antigas podem herdar estimativas do draft anterior. A request não fixa40 minutos. Autoria/revisão precisam reconciliar diferenças com pacing crível e disposição explícita, preservando o ensino completo. Nenhuma troca silenciosa de tempo ou corte de alvo para fazer o catálogo parecer planner-ready.

## Estado inicial da preparação

Dez aulas principais têm algum rascunho: MAT-01 a MAT-10. MAT-07 e MAT-PREREQ estão no Golden v3; as outras nove vêm do expansor de rascunhos. MAT-11 a MAT-18 precisam ser escritas. O material existente precisa de revisão de conteúdo e formato; contagem de rascunhos não equivale a aulas completas.

O inventário privado esperado em `.local/ifsc-official/track.source-pack.v2.json` não existe neste checkout; o fallback Golden só fornece MAT-07/MAT-PREREQ para Matemática. A preparação usou a API existente `Studio.init` com catálogo editorial fixado a partir da grade e metadados dos rascunhos, sem reconstruir o banco oficial. Agora existem 19 jobs reais com 106 Concepts canônicos, versões e pré-requisitos validados. Skeletons de inventário ficam explicitamente sem ensino e não prontos para o planner; os agrupamentos editoriais dos requisitos permanecem não verificados contra o original oficial.

Pesquisa da Lupa, autoria da Trama e QA do Crivo foram encaminhadas em filas reais; a Library pesquisa lacunas em contribuição separada. Nenhuma aula nova completa é alegada nesta etapa. Preparação reproduzível: `pnpm exec tsx .local/mathematics-production/prepare.ts`. Manifesto: `.local/mathematics-production/manifest.json`.

## Fila por aula

| Aula | Tema | Trabalho principal |
| --- | --- | --- |
| MAT-PREREQ | Frações, decimais e razões: preparação | Conferir rascunho v3, evidência e pré-requisitos; preservar versões anteriores |
| MAT-01 | Números e operações | Revisar explicações, propriedades e expressões; conferir todas as respostas |
| MAT-02 | Divisibilidade, primos, MMC/MDC | Revisar rascunho; verificar critérios e contexto MMC versus MDC |
| MAT-03 | Frações | Completar exemplos, prática, dicas e feedback; conferir operações |
| MAT-04 | Decimais e notação científica | Revisar rascunho; escolher recortes conferidos e excluir a etapa SEDUC incorreta |
| MAT-05 | Razão e proporção | Revisar; usar razão/produto constantes para justificar proporcionalidade |
| MAT-06 | Regra de três | Revisar direta/inversa, identificação e interpretação |
| MAT-07 | Porcentagem | Revisar Golden v3 e sua relação com a preparação |
| MAT-08 | Aplicações percentuais e juros | Revisar; conferir taxa/prazo, montante e problemas inversos |
| MAT-09 | Potências, radicais e expressões | Revisar; pesquisar propriedades/simplificação e condições de validade faltantes |
| MAT-10 | Desigualdades e intervalos | Revisar; pesquisar operações com negativos e intervalos reais |
| MAT-11 | Expressões algébricas e monômios | Escrever; conferir graus, termos semelhantes e operações em fontes selecionadas |
| MAT-12 | Polinômios, produtos notáveis e fatoração | Escrever; cotejar fontes, corrigir/excluir identidades erradas e validar por expansão |
| MAT-13 | Equações de primeiro grau | Escrever; solução, conferência, modelagem e interpretação |
| MAT-14 | Sistemas de equações | Escrever; substituição, eliminação e significado das soluções |
| MAT-15 | Equações de segundo grau | Escrever; fatoração, fórmula, raízes e aplicações no escopo fundamental |
| MAT-16 | Unidades, perímetro e área | Escrever; fechar evidência de capacidade/tempo/ângulos, além das áreas e perímetros |
| MAT-17 | Volumes e relações métricas | Escrever; conferir sólidos/unidades e correspondência cateto–projeção; excluir tabela UEPA incorreta |
| MAT-18 | Tabelas, gráficos, probabilidade e contagem | Escrever; pesquisar repetição/frequência/variabilidade e princípio multiplicativo |

IDs e Concepts seguem [MATHEMATICS.md](curriculum/MATHEMATICS.md). Organizar as aulas extensas em passos curtos, mantendo os alvos canônicos e o estudo mobile-first.

## O que falta para entregar como completo

1. **Evidência por conceito.** Usar a biblioteca como índice; abrir as páginas selecionadas, cruzar fórmulas/afirmações e registrar fontes. Fechar os bloqueios de radicais, desigualdades, relações angulares, conversões, frequência experimental e problemas inversos de juros. Fontes com erros conhecidos não são autoridade única.
2. **Autoria e revisão dos rascunhos.** Para cada alvo, oferecer intuição, explicação precisa, exemplos resolvidos com conferência, prática guiada e prática independente. Escrever conteúdo e situações próprios. Dicas progressivas e feedback não podem entregar a resposta antes da tentativa independente.
3. **Questões e conclusão da aula.** Seguir o guia: pelo menos duas questões por conceito e exatamente três exit Questions, com soluções completas, distratores defensáveis e números diferentes dos exemplos resolvidos. Concluir a aula nunca concede domínio.
4. **Representações acessíveis.** Usar figuras originais quando necessárias, com descrição textual equivalente e inspeção a 343 px; nenhuma mídia externa essencial. Trabalhar dentro dos renderers/evaluators existentes, sem equivalência algébrica livre ou simuladores inexistentes.
5. **QA real por aula.** Lupa pesquisa, Trama escreve e Crivo revisa de forma independente. Validação determinística, contas refeitas, correções de achados HIGH/CRITICAL e nova revisão do snapshot alterado. A matriz precisa distinguir fonte encontrada, evidência conferida, conteúdo escrito e conteúdo revisado.
6. **Entrega para o humano.** Índice das aulas com arquivos exatos, fontes, questões/gabaritos, relatório QA e ressalvas não bloqueantes; prévias usando o fluxo existente. Todas permanecem draft. A aprovação humana de exportação e a posterior publicação são etapas explícitas próprias.

Referências: [guia de autoria](LESSON-AUTHORING-GUIDE.md), [parecer da biblioteca](../../vecta-source-library/MAT/math-enrichment-ifsc-2027-1/EVALUATION-Estudisc.md) e [runbook do Studio](../../tools/vecta-content-studio/RUNBOOK-MAESTRI.md).

NEXT ACTION: coordenar as filas já iniciadas, conferir cada entrega e correção, gerar manuscritos/figuras/índice para revisão humana. Este plano não apresenta nenhuma aula nova como já completa ou aprovada.
