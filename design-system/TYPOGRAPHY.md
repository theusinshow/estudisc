# Estudisc — Tipografia

## Decisão final

- **Archivo**: branding, display, títulos, corpo e controles.
- **JetBrains Mono**: código, terminal, identificadores, atalhos e metadados técnicos.

A decisão está congelada para implementação V1.

## Regras

- display com contraste forte de tamanho, sem sacrificar quebra responsiva;
- corpo em Archivo com largura de leitura controlada;
- mono não deve dominar parágrafos longos;
- código e terminal nunca usam Archivo;
- labels técnicas podem usar uppercase, mas textos de ação permanecem legíveis;
- números de rank podem usar display; métricas técnicas usam mono quando necessário.

## Escala (ADR 0067)

`typography.scale`: 14 (meta) / 17 (corpo; 18 em telas largas) / 22 (lead) / 32 (título) / 48 (display) / 72 (hero).
Eixo `wdth` do Archivo (`typography.width.expanded`) só em títulos de tela e números grandes. Leitura com
`typography.readingMeasure` (66ch) e `typography.readingLeading` (1.55). Mono para tempo, nº da questão e data.

## Alternativas avaliadas

1. Archivo + JetBrains Mono — selecionada por personalidade editorial e clareza técnica.
2. Inter Tight + IBM Plex Mono — mais neutra e corporativa.
3. Space Grotesk + Source Code Pro — mais tecnológica, menos editorial.

A primeira combinação representa melhor o produto sem parecer um SaaS genérico.
