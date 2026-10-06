# Estudisc — Iconografia

## Biblioteca base

Lucide, mantendo a geometria original da biblioteca, incluindo `stroke-linecap`
e `stroke-linejoin`. Não modificar os SVGs globalmente para forçar cantos retos.

A marca Estudisc não faz parte da biblioteca Lucide. Seus arquivos e regras ficam
em `BRAND_ASSETS.md`.

## Símbolos proprietários

Glifos de Mastery, diff, terminal e outros símbolos técnicos próprios podem usar
geometria reta. Devem existir como componentes separados, nunca como forks
silenciosos de ícones Lucide.

Símbolos tipográficos aprovados:

| Símbolo | Significado |
|---|---|
| `○ ◔ ◑ ◕ ● ★` | Mastery 0–5, sempre acompanhado de nome acessível |
| `+ ~ − = !` | estados de diff/importação |
| `::`, `RUN /`, `TEST /`, `EXIT / n` | prefixos técnicos do Programming Lab |
| `>` | prefixo da Command Palette |
| `/` | separador de path e metadado técnico |

## Tamanhos

Consumir exclusivamente os tokens `icon.*` de `design-tokens.json`.
Não criar tamanhos locais por componente.

## Regras de aplicação

- usar apenas uma família de ícones de interface;
- `currentColor` como cor do ícone;
- ícone sozinho apenas quando a ação for universal no contexto;
- IconButton exige nome acessível e tooltip;
- ações críticas, primárias ou que alteram dados usam rótulo textual completo;
- `RUN`, `SUBMIT SOLUTION`, importação e ações destrutivas nunca são somente ícone;
- alinhar ícone e texto com layout flex e gap canônico, não com margens locais;
- não misturar ícones preenchidos e outline sem regra semântica;
- emoji é proibido como iconografia do produto;
- nenhum ícone pode ser o único indicador de estado.

## Marca

O símbolo oficial representa um caderno aberto e está disponível em SVG e PNG.
Ele pode aparecer em:

- app icon;
- favicon;
- touch icon;
- lockup institucional;
- tela de abertura pontual;
- materiais de apresentação.

Ele não deve aparecer como ícone de item de menu, atividade, status, botão ou
estado vazio. Para especificação completa, consultar `BRAND_ASSETS.md`.
