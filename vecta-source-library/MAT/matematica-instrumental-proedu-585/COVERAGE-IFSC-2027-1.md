# Cobertura da coleção — Matemática IFSC 2027/1

Complemento posterior: [avaliação editorial VECTA](EVALUATION-VECTA.md) registra erros matemáticos confirmados e amplia evidências de capacidade (Aula 14, pp. 14–15) e probabilidade empírica (Aula 17, p. 12). Estes tópicos têm apoio parcial; não são ausentes. O documento abaixo avalia cobertura, não correção de todos os exemplos.

Verificado em 2026-10-02. **Os 19 PDFs estão baixados, legíveis e íntegros; a coleção não cobre integralmente o programa de Matemática.** São 494 páginas e 32.218.100 bytes, com tamanhos e SHA-256 conferidos contra o catálogo.

Base desta comparação: [edital oficial 05/DEING/2027/1](https://www.ifsc.edu.br/documents/d/ingresso/edital-05_2027_1_tecnico_integrado_prova-ok-1-), Anexo V, seção Matemática, localizado pelo [portal oficial de editais](https://www.ifsc.edu.br/editais-com-inscricoes-abertas). O edital indica o universo de conteúdos possíveis, não quais questões aparecerão. A comparação é de fontes; não constitui aprovação das aulas VECTA, certificação de correção de todos os exemplos ou validação de todos os mapeamentos do projeto.

Método: abertura e leitura dos PDFs preservados, busca em todo o texto extraível e inspeção das seções pertinentes. Menção contextual ou presença de um exemplo isolado não foi considerada ensino completo do tópico. Ausência de tratamento significa que não foi localizado desenvolvimento didático suficiente nesta revisão; fórmulas/figuras podem exigir revisão humana adicional.

## Lacunas principais

| Tópico previsto no programa | Resultado na coleção | Evidência e complemento necessário |
| --- | --- | --- |
| Notação científica | Não localizado tratamento estruturado | Aulas 5/6/11 abordam decimais e potências; não foi localizada explicação sistemática de notação científica, conversões e operações nessa representação. |
| Juros | Menções, sem desenvolvimento suficiente | Aula 8, páginas PDF 3/4/9, cita juros e variação de taxa. Não foi localizado ensino de capital, taxa, prazo, juros e montante com problemas de juros simples. |
| Monômios e polinômios: graus e operações | Não localizado tratamento estruturado | Aula 6 contém expressões, substituição de valores, equações e produtos notáveis; não ensina sistematicamente classificação/graus e operações com monômios e polinômios. |
| Fatoração de polinômios | Não localizado tratamento estruturado | A fatoração em primos da Aula 4 é numérica. Os produtos notáveis da Aula 6 não substituem uma seção de fatoração de polinômios. Não foram localizados métodos estruturados de fator comum, agrupamento e padrões. |

## Coberturas parciais que merecem complemento

| Tópico | O que existe | Limite observado |
| --- | --- | --- |
| Divisibilidade | Aula 4 explica primos, fatoração numérica, MMC e MDC | Faltam critérios de divisibilidade desenvolvidos como conteúdo próprio. Não classificar MMC/MDC como ausentes: estão dentro do capítulo de frações. |
| Desigualdades | Aula 3, PDF 19, representa intervalos com desigualdades; Aula 8, PDF 9, compara taxas | Complementar propriedades/manipulação de desigualdades e resolução de inequações; o edital usa o termo geral desigualdades, sem especificar cada técnica. |
| Radiciação e propriedades | Aula 4, PDF 19, extrai raízes de frações; Aula 6, PDF 10, usa raízes em expressões | Complementar propriedades e simplificação de radicais com exemplos/exercícios próprios. |
| Capacidade e tempo | Aula 14, PDF 29, converte m³ para litros; Aulas 4/7 usam horas e dias em problemas | Capacidade tem ao menos conversão explícita e aplicação; ampliar as conversões. Não foi localizada seção sistemática de conversões de tempo. |
| Relações métricas no triângulo retângulo | Aula 18, PDFs 4/5, ensina Pitágoras; há razões trigonométricas e aplicações de alturas | Não foi localizada explicação estruturada de altura/projeções na hipotenusa e suas relações métricas específicas. |
| Estimativa de probabilidade por frequência de ocorrências | Aula 17 trabalha eventos, espaço amostral e proporções, inclusive dados de pesquisa (PDFs 8/9/10); Aula 19 aborda tabelas de frequências | Há apoio parcial, mas predomina a razão entre casos favoráveis e possíveis. Complementar estimação por frequência observada/repetição de experimentos; não tratar uma fórmula de probabilidade clássica como prova de cobertura empírica completa. |

## Conteúdos encontrados

- Números naturais, inteiros, racionais, irracionais e reais; operações e intervalos: Aulas 2/3.
- Frações, equivalência, simplificação, operações; primos, fatoração numérica, MMC e MDC: Aula 4, especialmente PDFs 13/17/19/20.
- Decimais e conversão com frações: Aula 5.
- Potenciação, expressões numéricas/algébricas, substituição de valores e exemplos de equações de primeiro grau: Aula 6. **Produtos notáveis existem**, na página PDF 11; faltam outros componentes do bloco de polinômios.
- Razões, proporções e regra de três direta/inversa: Aula 7, incluindo a definição de razão/proporção na página PDF 3.
- Porcentagem, aumentos e descontos: Aula 8.
- Equações de primeiro/segundo grau em exemplos de funções: Aula 9; sistemas lineares: Aula 15.
- Unidades de comprimento/área/volume, áreas, perímetros e volumes de cubo/paralelepípedo/cilindro: Aulas 12/14.
- Triângulos, Pitágoras e trigonometria: Aulas 13/18.
- Contagem pelo princípio multiplicativo: Aula 16; probabilidade: Aula 17; tabelas, gráficos e estatística: Aula 19.

PA/PG, logaritmos, funções e outros complementos aparecem na coleção, mas sua presença não supre automaticamente as lacunas do programa fundamental. A falta de Concepts específicos para alguns desses conteúdos também não significa que o PDF não os contém.

## Organização e estado

[Índice dos 19 arquivos locais](README.md). Catálogo canônico: `SRC-MAT-00001` a `SRC-MAT-00019`. Os mapeamentos foram ampliados para seções efetivamente encontradas, preservando IDs e hashes. As lacunas acima ficam visíveis para Researcher/QA e futura complementação da biblioteca. Nenhuma aula, questão ou aprovação foi produzida. A licença de reutilização continua `REQUIRES_REVIEW`.

Validação: PDFs reabertos com pypdf em modo estrito; hashes/tamanhos conferidos; `pnpm exec tsx vecta-source-library/manage.ts refresh` e `pnpm exec tsx vecta-source-library/manage.ts check`. O programa oficial foi inspecionado pela ferramenta web; a tentativa complementar de acesso ao IFSC via urllib encontrou erro de cadeia SSL, sem desativação de TLS. Isso não impediu a leitura da fonte oficial pela ferramenta web.
