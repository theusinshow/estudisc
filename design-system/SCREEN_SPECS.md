# KNOW/OS — Especificação de Telas

## IFSC v3 — approved delta


## Today

Primary purpose: answer “what should I study now?”

Order:

1. greeting/date compactly;
2. primary StudySession card;
3. start CTA;
4. short weekly/area progress;
5. due review/simulation summary;
6. bottom navigation.

Avoid a dense analytics dashboard.

## Study Session

Focus shell with:

- session progress;
- current item;
- one primary action;
- contextual hint/tutor entry;
- minimal global navigation.

## Lesson

Text itself does not require heavy card chrome. Use neo-brutalist surfaces mainly for interactive blocks, examples, callouts and questions.

## Question

Large tappable alternatives, visible selected state, clear submission state. In EXAM, do not reveal correctness.

## Assessment

Show question number, timer where applicable, answer state, next/previous and a compact question navigator. Finalization requires a clear confirmation if unanswered questions remain.

## Progress

Show mastery/retention and assessment trend before XP/badges.

## Admin

Separate dense shell. Mobile student visual constraints do not require Admin to hide necessary data density, but accessibility and token rules still apply.


Este documento define propósito, hierarquia e comportamento. Valores literais
vivem em `design-tokens.json`.

## Anatomia comum

Desktop: sidebar + topbar + workspace + painel contextual opcional.
Mobile: workspace único, navegação recomposta e ações persistentes somente
quando necessárias ao fluxo.

Cada tela deve possuir título visível, landmark principal e estado de carregamento,
vazio e erro quando aplicável.

## 1. Today

**Propósito:** indicar a próxima ação útil.

Hierarquia: Continuar → Revisar hoje → Missão atual → progresso resumido.
CTA primária: `CONTINUAR` ou `REVISAR AGORA`, escolhida pela recomendação vigente.
Vazio: orientar importação/criação do primeiro Track.

## 2. Learn / Tracks

Lista os Tracks e o avanço por módulos. Não exibir métricas corporativas.
CTA: abrir o próximo Track recomendado. Filtros são secundários.

## 3. Module

Mostra objetivos, pré-requisitos, lições e conceitos. Navegação livre com aviso
de pré-requisito, nunca bloqueio arbitrário.

## 4. Lesson

Leitura em coluna confortável, navegação por etapas e painel contextual opcional.
CTA: próxima etapa. Estados de autosave são discretos e acessíveis.

## 5. Concept

Documento vivo do conceito: definição, exemplos, laboratório, erros recentes,
review e mastery. CTA: `PRATICAR ESTE CONCEITO`.

## 6. Practice

Entradas: recomendada, por conceito, por erros e desafios. Deve explicar por que
cada sessão foi sugerida.

## 7. Focus Activity

Remove navegação não essencial. Exibe progresso da sessão, prompt, renderer,
dicas graduais e uma ação principal por etapa.

## 8. Code Activity

Segue `PROGRAMMING_LAB.md`. Editor e saída divididos no desktop; tabs exclusivas
em mobile. RUN e SUBMIT são ações distintas.

## 9. Review

Fila por conceito, duração estimada e razão da revisão. CTA: iniciar sessão.
Após concluir, mostrar evidência atualizada sem celebrar excessivamente.

## 10. Mistakes

Agrupa padrões, não culpa. Cada item liga conceito, tentativa, correção e prática.
Erros de sintaxe sem valor pedagógico devem ser classificados separadamente.

## 11. Knowledge Map

Desktop: grafo navegável + busca + painel de conceito.
Mobile: lista hierárquica equivalente e completa; não depender do canvas.

## 12. Progress

Mostra domínio, evidências, consistência e crescimento. XP e Mastery ficam em
regiões separadas e rotuladas.

## 13. Achievements / Badges

Selos técnicos, critérios transparentes e data. Sem emoji e sem estética medieval.

## 14. Rank

Rank global e por Track, quando aplicável. Explicar que rank mede jornada, não
certificação de domínio.

## 15. Projects

Lista Project Contexts e exercícios vinculados. CTA: abrir projeto recomendado.

## 16. Project Detail

Resumo, conceitos relacionados, atividades, erros e evidências aplicadas ao projeto.

## 17. History

Timeline técnica de eventos. Filtros por Track, conceito, projeto e tipo de evento.
Em mobile, registros viram blocos; não tabela horizontal.

## 18. Import Pack

Drop/paste/select → parse → validate. Exibir tipo, versão, origem e integridade.
CTA de aplicar só aparece após preview válido.

## 19. Import Preview / Diff

Mostra novos, atualizados, inalterados e conflitos. Dados comuns recompõem em
blocos; diff técnico pode usar layout empilhado ou overflow controlado.
`APLICAR` fica disabled enquanto houver conflito.

## 20. Export Teacher Context

Seleção granular de dados, estimativa de tokens e preview técnico. Avisar quando
o contexto estiver grande e sugerir recorte.

## 21. Command Palette

Busca e execução global. Atalho canônico: `Ctrl+K`. Resultados agrupados por ações,
conceitos, lições, projetos e packs.

## 22. Settings

Preferências: meta semanal, acessibilidade, densidade desktop, `dimmedPaper`,
atalhos, dados, export e backup. Não oferecer dark mode completo.

## Estados comuns

- loading: skeleton estrutural ou status textual;
- empty: explicar por que está vazio e apresentar próxima ação;
- error: nomear problema, consequência e recuperação;
- offline: mostrar disponibilidade local e operações bloqueadas;
- syncing/saved: estado discreto, persistente o suficiente para leitores de tela.
