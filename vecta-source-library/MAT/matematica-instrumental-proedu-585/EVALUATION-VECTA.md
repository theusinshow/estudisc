# Avaliação editorial para o VECTA

Data: 2026-10-02. Coordenação: Codex/ORCHESTRATOR. Auditorias reais, separadas e somente leitura no Maestri: Lupa/RESEARCHER (origem, cobertura e evidências) e Crivo/REVIEWER (qualidade factual, pedagógica e acessibilidade). Não é revisão de uma Lesson nem aprovação para publicação.

**Parecer: útil como referência suplementar, com cobertura curricular parcial e erros matemáticos confirmados. Não usar fórmulas, resoluções ou gabaritos automaticamente.** A qualidade institucional A do catálogo identifica a origem; não significa que todos os exemplos estão corretos.

## Escopo verificado

Os 19 PDFs locais foram abertos em modo estrito e tiveram tamanho/SHA-256 comparados ao catálogo: 494 páginas, 32.218.100 bytes. As referências de página abaixo usam a posição no PDF, começando em 1, e não a paginação impressa do livro.

Lupa inspecionou os trechos curriculares e renderizou visualmente páginas com possíveis erros. Crivo aprofundou a amostragem de frações, proporcionalidade, porcentagem, probabilidade e estatística, renderizou páginas pertinentes e recalculou exemplos com Fraction/Decimal. Não houve revisão factual de todos os exercícios, teste com leitor de tela ou certificação de acessibilidade.

Programa confrontado: [IFSC 05/DEING/2027/1](https://www.ifsc.edu.br/documents/d/ingresso/edital-05_2027_1_tecnico_integrado_prova-ok-1-), Anexo V, Matemática (página PDF 41). O programa é referência de cobertura; não determina quais tópicos serão cobrados em questões específicas.

As capas confirmam Ricardo Ferreira Paraizo/e-Tec Brasil. UFV e validação CECIERJ estão documentadas na curadoria anterior; o registro remoto ProEdu retornou HTTP 403 na rechecagem de Lupa. Essa parte da origem não foi reconfirmada remotamente nesta rodada.

## Aproveitamento por grupo

| Aulas | Utilidade no VECTA | Condições |
| --- | --- | --- |
| 1 | Contextualização da Matemática no cotidiano | Não substitui ensino/prática dos Concepts. |
| 2–5 | Números, frações, decimais e pré-requisitos | Prioridade para recuperação de fundamentos; recalcular exemplos e gabaritos. MMC/MDC/primos existem dentro da Aula 4, pp. 13/17/20. |
| 6–8 | Expressões, razões/proporções, regra de três e porcentagem | Alta relevância curricular, com falhas específicas abaixo. Não transferir os erros aos blocos ou perguntas VECTA. |
| 9 | Equações de primeiro/segundo grau em exemplos de funções | Selecionar trechos pertinentes; resolução quadrática em pp. 19–20. Estudo amplo de funções não é prioridade explícita do programa. |
| 10–11 | PA/PG, exponenciais e logaritmos | Referência de aprofundamento; não usar para preencher lacunas do programa fundamental. |
| 12–14 | Medidas, áreas, volumes e relações geométricas | Priorizar cubo/paralelepípedo/cilindro; selecionar os demais sólidos e tópicos conforme necessidade. Complementar ângulos e relações métricas. |
| 15 | Sistemas lineares | Pertinente ao programa; exigir nova conferência dos exemplos selecionados. |
| 16 | Princípio multiplicativo, pp. 4–5 | Selecionar contagem básica; permutações/arranjos/combinações não devem dominar a preparação. |
| 17 | Espaço amostral e probabilidade; germinação em p. 12 | Explicitar equiprobabilidade quando aplicável e limites da estimativa por frequência. |
| 18 | Pitágoras, pp. 4–5, e triângulos | Pitágoras não cobre sozinho todas as relações métricas previstas. Leis dos senos/cossenos são aprofundamento. |
| 19 | Tabelas/gráficos, pp. 11–15, e exemplos estatísticos | Adaptar a prática para interpretação sem Excel; corrigir gabarito de média. |

## Erros e riscos encontrados

Severidades indicam impacto se o trecho for incorporado ao ensino VECTA. Os originais permanecem intactos. Os achados de Crivo são independentes do Author; a linha da Aula 6 veio da conferência visual de Lupa.

| ID | Severidade | Evidência | Achado e correção necessária |
| --- | --- | --- | --- |
| MAT-QA-01 | CRITICAL | [Aula 4](pdfs/Aula_04.pdf), p. 24 | A resolução de `1/2 + 1/4 × (2/3)² − 1/4` termina em `2/9`; o resultado correto é `13/36`. |
| MAT-QA-02 | HIGH | [Aula 6](pdfs/Aula_06.pdf), p. 11 | Identidades de quadrados de binômios têm expoentes/sinal incorretos na impressão. Conferir cada identidade; `(a − b)² = a² − 2ab + b²`. |
| MAT-QA-03 | CRITICAL | [Aula 7](pdfs/Aula_07.pdf), pp. 17/23 | `65/23` horas é convertido em `2h19min`; corresponde aproximadamente a `2h49min34s`. Confirmado por ambos os auditores. |
| MAT-QA-04 | CRITICAL | [Aula 8](pdfs/Aula_08.pdf), p. 18 | Feedback informa `457,95` para 37% de 1.237; correto: `457,69`. |
| MAT-QA-05 | HIGH | [Aula 8](pdfs/Aula_08.pdf), p. 21 | Resumo equipara 10% a `1/100`; correto: `10/100 = 1/10 = 0,10`. |
| MAT-QA-06 | CRITICAL | [Aula 19](pdfs/Aula_19.pdf), pp. 18/27/28 | Sete produções anuais somam 7.050 t, mas o gabarito divide por seis e obtém 1.175 t. Correto: `7.050/7 ≈ 1.007,14 t`. |
| MAT-QA-07 | HIGH | [Aula 7](pdfs/Aula_07.pdf), pp. 9/18 | O critério aumenta/aumenta ou aumenta/diminui é insuficiente para provar proporcionalidade. Ensinar razão constante na direta e produto constante na inversa. |
| MAT-QA-08 | HIGH | [Aula 17](pdfs/Aula_17.pdf), pp. 10/21 e 12/24 | Crivo aponta condição de equiprobabilidade não explicitada e apresentação insuficientemente cautelosa da germinação futura. Ao selecionar o trecho, distinguir modelo equiprovável de estimativa baseada em frequência observada e declarar pressupostos. |

Deslizes editoriais separados dos erros de resultado: Aula 7, p. 7, imprime `8 × 12 = 16 × 12`, enquanto a tabela indica `16 × 6`; Aula 8, p. 24, usa 15% em etapas de uma resolução de 15,5%; Aula 17, p. 2, remete porcentagem à Aula 6 em vez de 8, e p. 24 remete combinatória à Aula 14 em vez de 16. Não copiar essas instruções sem correção.

## Pedagogia e adequação

A sequência explicação → exemplo → atividade → respostas favorece o estudo autônomo. Há representações/equivalência de frações e exemplos contextualizados. Crivo conferiu trechos corretos de aumentos/descontos sucessivos na Aula 8, pp. 18–20, e médias simples/ponderadas na Aula 19, pp. 17/19/20/28. Isso não elimina os erros específicos das mesmas aulas.

O feedback é desigual: algumas resoluções são detalhadas; a prática de gráficos da Aula 19, p. 27, repete instruções de Excel e oferece poucos critérios de autocorreção. Para o VECTA, selecionar explicações curtas e inserir recuperação ativa, prática guiada, dicas graduais e prática independente com feedback validado.

O item 7.12 do edital proíbe calculadora na prova. Exercícios dependentes de calculadora na Aula 8 e de Excel na Aula 19 precisam de alternativas resolúveis sem ferramentas. Excel 2007 e dados históricos podem servir como contexto datado, mas não devem ser apresentados como instruções ou dados atuais.

## Cobertura e refinamentos à auditoria anterior

As principais lacunas permanecem: notação científica, ensino estruturado de juros, graus/classificação/operações de monômios e polinômios, e fatoração algébrica. Juros são mencionados na Aula 8, pp. 3/4/9; produtos notáveis na Aula 6, p. 11, não suprem fatoração ou todo o estudo de polinômios.

Complementar critérios de divisibilidade, propriedades/simplificação de radicais, manipulação de desigualdades, ângulos, conversões de tempo e relações entre altura/projeções na hipotenusa. A descoberta de referências existentes não equivale a uma sequência didática completa.

Dois refinamentos importantes ao [relatório de cobertura](COVERAGE-IFSC-2027-1.md):

- Aula 14, pp. 14–15: há relações entre cm³, mL e litros, além da conversão m³/litros já registrada. Capacidade tem apoio maior que uma única conversão isolada.
- Aula 17, p. 12: há exercício de estimativa de germinação com 30 ocorrências em 40 sementes. Existe evidência direta de probabilidade empírica, embora seja necessário melhorar a discussão de condições/incerteza. Não classificar o tópico como ausente.

Tempo aparece em problemas da Aula 7, pp. 8/23, inclusive no erro de conversão acima; isso não demonstra ensino sistemático de conversões. Presença no PDF e correspondência na taxonomia VECTA são verificações diferentes.

## Acessibilidade e licença

Crivo verificou texto extraível nos 19 PDFs, mas não encontrou árvore estrutural de tags nem idioma declarado. Fórmulas perdem organização na extração; páginas fixas, figuras e capturas de Excel podem criar barreiras. Isso exige remediação antes de oferta direta; não é um teste completo de leitor de tela. Preferir blocos semânticos VECTA, fórmulas conferidas, descrições textuais e figuras acessíveis com direitos adequados.

O catálogo conserva `REQUIRES_REVIEW`. O [RDF preservado](license-evidence.xml) registra [CC BY-NC-ND 3.0 US](https://creativecommons.org/licenses/by-nc-nd/3.0/us/), com conflito no rodapé da coleção. Não considerar referências bibliográficas ou presença na Library como liberação automática para copiar páginas, figuras ou adaptações. Nenhum status de licença foi promovido nesta avaliação.

## Orientação para os agentes

1. Researcher usa os trechos pertinentes como uma fonte suplementar e cruza afirmações, fórmulas e soluções com outra fonte verificada; mantém os achados acima visíveis no Source Pack.
2. Author cria ensino e perguntas próprios, recalcula todos os resultados e trata os recursos externos como suplementares. Não transporta gabaritos de maneira automática.
3. Reviewer verifica os alvos com achados HIGH/CRITICAL e confirma correções no artefato realmente selecionado, antes de recomendar aprovação.
4. Priorizar fontes complementares para as lacunas do edital; material avançado extra não conta como substituto.

Nenhum lesson job foi iniciado, nenhum original/catalog foi alterado, e nenhuma aprovação de fonte, Lesson, importação ou publicação foi produzida. Lupa e Crivo retornaram a STANDBY; Trama permaneceu em STANDBY.

Validação operacional: `pnpm exec tsx vecta-source-library/manage.ts check` passou (19 fontes, 378 Concepts e 21 arquivos derivados). Auditorias receberam/retornaram resultados por `maestri ask --batch`; leitura/hash/renderização/recálculos ocorreram em scripts `python -B -` dos agentes. O ORCHESTRATOR consolidou seus pareceres e não simulou revisão independente.
