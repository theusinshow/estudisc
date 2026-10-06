# Estudisc — Índice do Design System (fonte de verdade)

## Delta IFSC integrado

As regras v3 em ifsc-v3/ refinam telas e componentes de estudo. ACCESSIBILITY.md e design-tokens.json continuam no topo da precedência. Student mobile: Hoje, Aprender, Progresso, Mais; Admin separado; Programming Lab mantém sua autoridade técnica. TOKENS-DELTA.json é proposta histórica e não deve ser consumido pelo runtime. Valores aprovados vivem somente no JSON canônico.

Versão atual: consulte design-system/VERSION (fonte única).

**Status:** APPROVED / FROZEN FOR IMPLEMENTATION

Leia este arquivo primeiro. Ele define onde cada decisão vive, quem vence em
caso de conflito e o que é obrigatório para implementação.

---

## 1. Ordem de precedência

Em caso de divergência entre documentos, vence o mais alto desta lista:

1. **ACCESSIBILITY.md** — acessibilidade vence a estética.
2. **design-tokens.json** — valores canônicos: cor, tamanho, duração e breakpoint.
3. **INTERACTION_STATES.md** — significado dos estados e canais de comunicação.
4. **SCREEN_SPECS.md** — layout, hierarquia, ações e estados por tela.
5. **PROGRAMMING_LAB.md** — autoridade final para editor, terminal, testes e RUN/SUBMIT; sobrepõe SCREEN_SPECS na Atividade de Código.
6. **RESPONSIVE.md** — recomposição por breakpoint.
7. **COLOR_SYSTEM.md · TYPOGRAPHY.md · MOTION.md · ICONOGRAPHY.md · BRAND_ASSETS.md · VISUAL_IDENTITY.md · DENSITY.md** — regras por disciplina e marca.
8. **COMPONENT_SYSTEM.md** — inventário, anatomia e variantes dos componentes.
9. **DESIGN_DIRECTION.md** — tese e princípios; contexto, não especificação literal.
10. **KNOW-OS.dc.html** — referência visual somente; nunca é fonte normativa.

Regra prática: se o protótipo divergir do documento, o protótipo está desatualizado.
Corrija o protótipo; não enfraqueça a especificação.

---

## 2. O que cada arquivo define

| Arquivo | Define | Não define |
|---|---|---|
| `design-tokens.json` | valores literais, aliases semânticos e changelog | contexto de uso |
| `DESIGN_DIRECTION.md` | tese, princípios e direções rejeitadas | valores literais |
| `COMPONENT_SYSTEM.md` | inventário, variantes, anatomia e contratos | composição de tela |
| `SCREEN_SPECS.md` | propósito, layout, hierarquia, CTA, estados e teclado por tela | valores de token |
| `INTERACTION_STATES.md` | estados globais, educacionais, de atividade e importação | movimento |
| `PROGRAMMING_LAB.md` | execução de código, terminal, testes, RUN/SUBMIT e histórico | tokens do editor |
| `RESPONSIVE.md` | breakpoints e recomposição | semântica de estados |
| `ACCESSIBILITY.md` | teclado, foco, semântica, contraste, toque e reduced motion | linguagem estética |
| `MOTION.md` | comportamento de movimento e proibições | durações canônicas |
| `TYPOGRAPHY.md` | famílias, papéis, pesos e aplicação | escala numérica |
| `COLOR_SYSTEM.md` | papel e contenção de cada cor; política de tema | hexes canônicos |
| `ICONOGRAPHY.md` | biblioteca, aplicação e símbolos de domínio da interface | arquivos da marca |
| `BRAND_ASSETS.md` | símbolo, wordmark, lockup, assets e uso da marca | iconografia de ações e estados |
| `VISUAL_IDENTITY.md` | regras operacionais de identidade visual, logo, acentos e aplicação no software | valores canônicos ou novos assets |
| `DENSITY.md` | regimes de densidade e regras de conforto | quantidade de dados do produto |
| `UX_RECOMMENDATIONS.md` | recomendações de produto ainda não normativas | contrato visual |
| `KNOW-OS.dc.html` | ritmo e referência visual navegável | qualquer decisão normativa |
| `KNOW-OS Icone.dc.html` | exploração de app icon/favicon | iconografia da interface |

---

## 3. Tokens canônicos

`design-tokens.json` é a única fonte de valores literais. O código de
produção deve consumir CSS custom properties geradas a partir do JSON.

Não escrever diretamente em componentes:

- cores em hex/rgb/hsl;
- espaçamentos em px;
- duração em ms;
- z-index arbitrário;
- breakpoints locais.

Grupos principais:

`color`, `state`, `focus`, `typography`, `spacing`, `border`, `radius`,
`shadow`, `motion`, `breakpoint`, `size`, `icon`, `touch`, `density`,
`editor`, `terminal`, `execution`, `zIndex`, `mastery`, `diff`, `toast`.

Mudanças ficam em `$changelog`. Remover ou renomear token exige justificativa,
migração e atualização do changelog.

---

## 4. Referência visual apenas

- `KNOW-OS.dc.html`: protótipo de telas e Command Palette. Execução de código é simulada; responsividade e estados não são completos.
- `KNOW-OS Icone.dc.html`: referência visual do símbolo aprovado; os assets canônicos e regras estão em `BRAND_ASSETS.md`.
- `uploads/`: referências de inspiração; não normativas.

---

## 5. Regras mandatórias

1. **Nenhum estado depende exclusivamente de cor.** Todo estado precisa de ao menos um indicador não cromático inequívoco: texto, ícone, forma, posição ou padrão. Estados críticos — erro, sucesso, conflito e bloqueio — usam no mínimo dois canais não cromáticos.
2. **`outline: none` sem substituto é proibido.** Todo elemento focável usa o sistema canônico de foco.
3. **XP e Mastery nunca compartilham a mesma barra ou módulo visual.** Podem existir na mesma tela quando estiverem claramente separados e rotulados.
4. **Uma CTA primária por contexto de decisão visível.** Regiões independentes, drawers ou modais podem ter sua própria CTA, desde que não concorram dentro do mesmo fluxo.
5. **RUN nunca registra tentativa. SUBMIT SOLUTION sempre registra.** Possuem rótulos completos, atalhos distintos e separação visual.
6. **Superfície escura significa que a máquina executa ou representa saída técnica.** Usar em editor, terminal, testes, saída, code blocks, preview técnico e tooltip. Não existe dark mode completo.
7. **Raio base entre 0 e 4px; superfícies de aprendizagem e sheets usam os tokens canônicos de 12–18px. Sombra sólida.** Gradiente, blur, glassmorphism e sombra difusa são proibidos.
8. **Movimento de interface usa no máximo 180ms e deslocamento de 2–4px.** Nenhuma animação contínua decorativa.
9. **Tipografia: Archivo + JetBrains Mono.** Mono para código, saída técnica e metadados; Archivo para leitura e interface.
10. **Alvo de toque mínimo abaixo de 1200px: 44px.** Densidade compacta é desativada abaixo de 768px.
11. **Emoji é proibido como iconografia.** Lucide é a biblioteca base em sua geometria original. Símbolos proprietários Estudisc podem usar cantos retos.
12. **Erro é dado, nunca punição.** A mensagem nomeia o problema e explica o conceito relevante; sem shake, culpa ou vermelho isolado.
13. **Tabelas de dados recompõem em blocos abaixo de 1200px.** Conteúdo técnico dependente de largura — código, diff, terminal, stack trace e matrizes — pode usar overflow controlado, tabs ou uma visualização alternativa documentada.
14. **Recomposição, não redução.** Mapa vira lista no mobile; diff empilha; editor e terminal viram tabs exclusivas.
15. **Importação é atômica.** `APLICAR` permanece desabilitado enquanto houver conflito não resolvido.
16. **Tema do sistema não ativa dark mode.** `dimmedPaper` é preferência manual de conforto de leitura, nunca resposta automática a `prefers-color-scheme`.

---

## 6. Ordem de implementação sugerida

1. Tokens → CSS custom properties + reduced motion.
2. Chassi → window chrome, sidebar, topbar, statusbar, skip links e foco.
3. Primitivos → Button, IconButton, Input, Badge, MasteryIndicator, XPIndicator, Panel, Divider, Tabs e Table.
4. Overlays → Command Palette, Modal, Drawer e Toast com foco preso e `inert`.
5. Lesson Blocks + ActivityShell e seus renderers.
6. Programming Lab → worker isolado, terminal, testes, RUN/SUBMIT.
7. Import/Export → validação, preview, diff e aplicação atômica.
8. Knowledge Map → canvas/graph + fallback de lista no mesmo incremento.
9. Passe de acessibilidade e responsividade em cada feature; nunca como fase opcional final.

---

## 7. Aberto

- App icon e lockup aprovados e documentados em `BRAND_ASSETS.md`.
- Schema de conteúdo dos Learning Packs é arquitetura de produto, fora deste Design System.
- Sonorização está fora de escopo; o produto é silencioso.
