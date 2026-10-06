# Estudisc - Regras de identidade visual

Versão atual: consulte design-system/VERSION (fonte única).

Este documento transforma as regras de marca em critérios operacionais para o
software. Ele complementa `BRAND_ASSETS.md`, `COLOR_SYSTEM.md`,
`TYPOGRAPHY.md`, `RESPONSIVE.md` e `ACCESSIBILITY.md`.

## 1. Tese visual

Estudisc é um sistema operacional pessoal de aprendizagem. A interface deve
parecer uma mesa técnica de estudo: papel claro, estrutura visível, bordas
firmes, decisões explícitas e leitura em primeiro plano.

A identidade não é decoração. Ela orienta fluxo, confiança e continuidade:

- estudar antes de praticar;
- evidência antes de progresso;
- importação validada antes de catálogo ativo;
- execução técnica separada da leitura;
- acentos por área sem transformar a tela em tema multicolorido.

## 2. Logo exato

O logo oficial é o conjunto aprovado em `design-system/assets/` e sincronizado
para `public/branding/`.

### Símbolo canônico

Arquivo: `design-system/assets/know-os-icon.svg`

Geometria:

- viewBox: `0 0 64 64`;
- símbolo baseado em um caderno aberto;
- duas páginas principais, lombada central e cortes laterais;
- página esquerda em `color.paper`;
- página direita em `color.signal`;
- traços retos, `stroke-linecap="square"` e `stroke-linejoin="miter"`;
- linhas internas somente na página esquerda.

Uso:

- app icon, favicon ampliado, avatar de produto, tela de autenticação e
  materiais onde o nome Estudisc já esteja próximo;
- preferir SVG sempre que o contexto aceitar vetor;
- usar PNG apenas para exigência de plataforma.

### Lockup horizontal

Arquivo: `design-system/assets/know-os-lockup.svg`

Geometria:

- viewBox: `0 0 260 40`;
- símbolo à esquerda;
- wordmark `Estudisc` à direita;
- wordmark em JetBrains Mono, peso 700, uppercase, tracking de referência
  `0.22em`;
- cor do wordmark em `color.ink`.

Uso:

- topbar;
- tela de autenticação;
- documentação de produto;
- exportações visuais controladas;
- apresentações internas quando houver espaço horizontal.

### Versões pequenas

Arquivos:

- `design-system/assets/know-os-icon-26.svg`;
- `design-system/assets/know-os-icon-32.png`;

Regra:

- abaixo de 32 px, usar a versão simplificada;
- não tentar reduzir o SVG canônico completo quando as linhas internas perderem
  nitidez;
- não criar favicon manual a partir do lockup.

### Versão monocromática

Arquivo: `design-system/assets/know-os-icon-mono.svg`

Uso:

- impressão de uma cor;
- fundos onde `signal` não reproduz com contraste suficiente;
- contexto técnico restrito que exige marca sem cor.

Não usar a versão mono para remover personalidade do produto quando a versão
principal funciona.

## 3. Área de respiro e tamanho

Área mínima de respiro:

- símbolo isolado: pelo menos 25% da largura do símbolo em todos os lados;
- lockup: pelo menos a altura da lombada central em todos os lados;
- dentro da topbar do app, preservar respiro por padding do componente e nunca
  encostar o logo em borda de janela.

Tamanhos mínimos:

- lockup completo: 154 px de largura no app shell, ou maior;
- símbolo canônico: 40 px quando usado com detalhes internos;
- símbolo simplificado: 16 a 32 px;
- favicon raster: usar `know-os-icon-32.png`.

Tamanhos máximos:

- dentro do produto, o logo não deve competir com o título da tarefa;
- em telas autenticadas, o logo identifica o sistema, mas a tela deve começar
  pela ação ou estado de estudo.

## 4. Cores da identidade

Cores estruturais:

- `color.ink`: texto, traço, borda e estrutura;
- `color.paper`: leitura e área de conteúdo;
- `color.panel`: agrupamento editorial;
- `color.desk`: fundo externo;
- `color.machine`: código, terminal e saída técnica;
- `color.signal`: ação primária, foco editorial pontual e estado atual.

Regra central:

`signal` é parte do logo, mas não autoriza amarelo decorativo em toda a
interface. No produto, amarelo deve aparecer quando há decisão, foco ou estado
atual.

## 5. Acentos por área

Os acentos de Step 15 são orientação de seção, não tema separado.

Aplicação permitida:

- eyebrow;
- borda interna completa;
- sombra pressionada;
- pequenos selos técnicos;
- fundo tintado pontual com contraste validado.

Aplicação proibida:

- pintar cards inteiros para enfeite;
- substituir CTA primária;
- comunicar estado apenas por cor;
- criar gradientes;
- criar variações do logo por área.

Mapa de uso:

| Área | Token | Uso |
|---|---|---|
| Primeiro uso e importação | `accent.onboarding` | ativar conteúdo, importar Pack, orientar catálogo vazio |
| Aprendizado | `accent.learn` | trilhas, aulas, conceitos, mapa |
| Prática | `accent.practice` | atividades e laboratório |
| Revisão | `accent.review` | revisão espaçada |
| Erros | `accent.mistakes` | recuperação e categorização |
| Progresso | `accent.progress` | XP, ranks, evidências |
| Geração | `accent.generation` | Manual, DeepSeek e preview de geração |

## 6. Tipografia

Famílias oficiais:

- Archivo: interface, leitura, títulos, botões e conteúdo editorial;
- JetBrains Mono: wordmark, código, terminal, metadados, IDs e labels técnicas.

Regras:

- não substituir o wordmark por texto vivo em Archivo;
- não usar JetBrains Mono para parágrafos longos;
- labels técnicas podem usar uppercase e tracking;
- ações devem ser legíveis, mesmo quando usam linguagem técnica;
- não usar fonte display externa sem revisão do Design System.

## 7. Forma e textura

Forma:

- raio base entre 0 e 4 px; superfícies de estudo usam os tokens canônicos de 12–18 px;
- borda sólida;
- sombra sólida;
- composição em blocos claros;
- nenhuma superfície com blur ou vidro.

Textura permitida:

- fundos planos;
- `machine` para saída técnica;
- sombras duras;
- bordas internas completas.

Textura proibida:

- gradiente decorativo;
- sombra difusa;
- glassmorphism;
- cantos arredondados grandes;
- ilustração SVG decorativa competindo com o logo.

## 8. Uso dentro do aplicativo

Topbar:

- usar o lockup oficial;
- link acessível com nome `Estudisc página inicial`;
- manter o logo estático;
- não recolorir por rota.

Sidebar e navegação:

- usar Lucide para ações e destinos;
- não usar o símbolo Estudisc como item de navegação;
- `signal` marca rota atual;
- acentos de área podem reforçar seções de conteúdo, não itens inativos.

Telas vazias:

- usar texto claro, uma CTA primária e sequência de ação;
- não usar o logo como ilustração grande de vazio;
- primeiro uso deve apontar para ativar conteúdo.

Aulas:

- conteúdo teórico é o objeto principal;
- conceitos são apoio e evidência;
- prática vem depois da leitura;
- código e terminal entram em `machine`, separados visualmente.

## 9. Uso fora do aplicativo

Documentação:

- preferir lockup em cabeçalhos;
- usar símbolo isolado apenas quando o nome Estudisc já estiver explícito;
- não centralizar o logo em páginas operacionais quando houver tarefa principal.

Exportações e relatórios:

- usar lockup em capa ou cabeçalho;
- manter contraste em impressão;
- não aplicar acentos de área ao logo;
- incluir data, contexto e tipo de exportação em texto, não em variação visual da
  marca.

Marketing futuro:

- pode usar composição mais expressiva, mas a geometria do logo permanece
  congelada;
- animação de marca é exceção, não padrão;
- qualquer alteração de símbolo, wordmark, cor principal ou proporção exige ADR.

## 10. Usos proibidos do logo

- alterar cores internas;
- aplicar gradiente, brilho, blur ou sombra difusa;
- arredondar cantos;
- distorcer, inclinar, rotacionar ou espremer;
- trocar `/` por outro separador;
- substituir JetBrains Mono no wordmark;
- empilhar `KNOW` e `OS` sem aprovação;
- usar o símbolo como bullet, ícone de botão ou indicador de estado;
- animar em loop dentro do produto;
- aplicar versão por disciplina, trilha, provedor ou usuário.

## 11. Checklist de implementação

Antes de entregar qualquer tela ou documento visual:

- o asset vem de `public/branding/` ou `design-system/assets/`;
- o logo preserva proporção e viewBox;
- há nome acessível quando o logo é link ou controle;
- o amarelo aparece como `signal`, não como decoração;
- acento de área tem indicador não cromático junto;
- texto não depende de cor para comunicar estado;
- mobile mostra uma ação principal por vez;
- não há overflow horizontal global abaixo de 768 px;
- `RUN` e `SUBMIT SOLUTION` continuam separados;
- screenshots de pelo menos uma largura mobile e uma desktop foram revisados
  quando a mudança afeta layout.

## 12. Fonte de verdade

Para implementação, a precedência permanece:

1. `ACCESSIBILITY.md`;
2. `design-tokens.json`;
3. `BRAND_ASSETS.md`;
4. `COLOR_SYSTEM.md`;
5. este documento;
6. protótipos HTML apenas como referência visual.

Se este documento divergir de `BRAND_ASSETS.md` ou dos tokens, corrija este
documento. Não ajuste o logo diretamente no app.
