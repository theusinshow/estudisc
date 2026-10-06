# Avaliação independente do enriquecimento de Matemática

2026-10-02. Coordenação: Codex. Pareceres reais de Lupa/RESEARCHER, Trama/AUTHOR e Crivo/REVIEWER, recebidos por Maestri. Esta avaliação de fontes é amostral; não aprova aulas, direitos de incorporação ou publicação.

**Resultado: a biblioteca ganhou referências úteis, mas a entrega precisava de correções factuais e de limites mais claros.** Foram confirmadas 46 inclusões, 65 fontes totais, 41 novas referências ativas e cinco no inbox, sem duplicação de IDs/locators. A revisão encontrou dois materiais adicionais com erros; seus registros agora estão `HAS_ERRORS`, `REFERENCE_ONLY` para uso factual e `SUPPLEMENTAL`. Os outros 63 registros e todos os PDFs originais foram preservados.

## Trabalho efetivamente realizado

| Responsável | Verificação | Limite |
| --- | --- | --- |
| Lupa | Contagens, duplicações, proveniência, edital e amostra de fontes/ratings; erro novo na tabela UEPA e na conversão SEDUC | Não revisou as 55 candidatas nem todos os gabaritos |
| Trama | Sequência de pilotos, pré-requisitos, prática e limites do renderer; leitura direta IFTO pp. 8–12 e IFES pp. 23–27 | Não reabriu os demais originais; identificou evidência herdada |
| Crivo | Recálculo e leitura dos originais SEDUC, CECIERJ, IFES/polinômios e SME; direitos e sinais técnicos dos dois PDFs locais | UTFPR retornou 403; acessibilidade sem teste de leitor de tela |
| Codex | Hashes, catálogo/testes, integridade dos PDFs, conflitos entre pareceres e confirmação textual SEDUC/UEPA/SME e ProEdu | Capturas web dos PDFs SEDUC/UEPA falharam por timeout; não houve inspeção visual independente dessas páginas por Codex |

Os seis hashes da entrega foram mantidos durante as três auditorias. As correções posteriores foram feitas pela coordenação, depois da coleta, e são registradas no histórico do catálogo. O snapshot anterior e os relatórios completos permanecem em `.local/library-enrichment-review/`: `input-hashes.json`, `sources-before-review.json`, `coverage-before-review.md`, `lupa.md`, `trama.md`, `crivo.md` e `coordinator.md`. São evidências locais de retomada, não aprovações simuladas.

Na conferência posterior à correção aritmética de seu próprio parecer, Crivo encontrou 5/6 hashes iguais: o catálogo já tinha recebido os alertas protetivos da coordenação. Ele registrou a divergência sem reler ou alterar o catálogo. Essa diferença é intencional e não deve ser confundida com um segundo snapshot auditado independentemente; os alertas finais estão ligados às evidências dos originais e ao histórico preservado. `final-hashes.json` identifica os arquivos após integração.

## Achados e correções

| Fonte/alvo | Impacto | Evidência e tratamento |
| --- | --- | --- |
| SRC-MAT-00056, UEPA | CRITICAL se incorporado ao ensino | Quadro 2, PDF p. 10 / impressa 9: relações cruzadas incompatíveis com a própria convenção cateto/projeção. Um triângulo 3–4–5 fornece contraprova. Na convenção dessa fonte, as relações coerentes são `bh=cm` e `ch=bn`. Novo `HAS_ERRORS`; nota anterior de validação preservada como histórico, sem tratar toda a tabela como correta. [Original UEPA](https://educapes.capes.gov.br/bitstream/capes/569769/1/PRO_Anderson%20Portal%20Ferreira.pdf). |
| SRC-MAT-00020, SEDUC | HIGH | PDF p. 2: etapa intermediária converte `0,00001618` em `1,1618×10⁻⁵`; o coeficiente correto é `1,618`. A amostra de operações da p. 9 confere. Novo `HAS_ERRORS`; usar apenas trechos corrigidos e cotejados. [Original SEDUC](https://www.aprendizagemconectada.mt.gov.br/documents/14069491/14090458/Agosto_8_Ano_EF_EAM.pdf/cb8a50a2-3687-0004-a15f-7ca223c216b7). |
| SRC-MAT-00033 e 00037 | CRITICAL se copiado | Crivo confirmou nos originais a identidade de quadrado perfeito com termo central errado e `p(2)=20` em vez de `14`. Mantidas as restrições já catalogadas. |
| SRC-MAT-00031 | HIGH, evidência herdada | Erro decimal documentado pela Library; recálculo é incompatível com a taxa informada, mas o original não foi reaberto por Crivo devido a 403. Mantido `HAS_ERRORS`, sem inventar confirmação independente da página. |
| Relatório: SRC-MAT-00058 | Correspondência de notação | Corrigida a troca de letras/projeções: na [fonte SME](https://sme.goiania.go.gov.br/conexaoescola/eaja/matematica-explorando-as-relacoes-metricas-no-triangulo-retangulo/), `c²=am` e `b²=an`. O catálogo já tinha essa convenção correta. |
| Relatório: capacidade | Cobertura subestimada | ProEdu Aula 14, PDF p. 15, relaciona cm³, mL e litros; p. 29 relaciona m³ e litros. Corrigida a afirmação de que só havia a última conversão. A unidade completa continua parcialmente sustentada. |
| Parecer Crivo: divisibilidade | Erro do próprio parecer, reparado | A atividade IFES p. 24 pergunta sobre 836; não imprime resposta afirmativa. `836=8×104+4`, portanto não é divisível por 8. Codex identificou o erro; Crivo corrigiu seu próprio arquivo e distinguiu pergunta de resposta. Isso não é erro atribuído à fonte. |

Após os alertas protetivos, a distribuição matemática das 46 inclusões é: **5 HAS_ERRORS, 21 PARTIALLY_VERIFIED, 19 REFERENCE_ONLY e 1 VERIFIED**. O último status refere-se somente ao recorte SME conferido. Todas as 46 continuam `RESEARCH_REQUIRED` no Studio. Direitos permanecem 20 LINK_ONLY, 24 UNKNOWN, dois REQUIRES_REVIEW e zero APPROVED_EMBED.

## Decisão para a próxima autoria

Melhores candidatos a pilotos: **notação científica, divisibilidade e relações métricas**, com conferência independente de cada exemplo, respostas próprias e mídia acessível. Em métricas, priorizar o recorte SME 00058; o quadro UEPA 00056 exige errata. Em notação, a p. 9 SEDUC tem amostra correta, mas a fonte inteira tem erro conhecido e exige cotejo. Pilotos são recomendações; nenhum job foi iniciado.

Juros simples, operações polinomiais, fatoração, tempo/capacidade e probabilidade introdutória têm base condicional. Ângulos e tempo foram reclassificados como PARTIAL no relatório para refletir o alcance da inspeção, sem apagar referências úteis. Ainda faltam evidências selecionadas/verificadas para:

- Inequações: multiplicação/divisão por negativo e intervalos reais.
- Radicais: propriedades, simplificação e condições de validade.
- Ângulos: complementares, suplementares e opostos pelo vértice.
- Capacidade: tratamento sistemático das equivalências/conversões, incluindo dm³, e prática conferida.
- Probabilidade experimental: repetição, frequência absoluta/relativa, variabilidade e pressupostos.
- Juros: conjunto conferido de problemas inversos; tempo: durações com unidades mistas.

Não fazer uma aula depender de vídeo, GeoGebra ou simulador externo. O renderer atual não avalia equivalência algébrica livre nem oferece simulador geométrico genérico. As fontes continuam referências: explicações, prática guiada/independente e exit tickets VECTA ainda precisam ser escritos e revisados.

## Validação e retomada

Comandos da coordenação: `maestri list`, `maestri ask` para os quatro terminais e `maestri check`; `Get-FileHash -Algorithm SHA256` nos seis inputs; auditorias inline `python -` com pypdf; `python .local/library-enrichment-review/apply-findings.py`; `pnpm exec tsx vecta-source-library/manage.ts refresh`; `pnpm exec tsx vecta-source-library/manage.ts check`; `pnpm exec vitest run tests/unit/source-library.test.ts`; `git diff --check`. Resultados finais constam na seção correspondente de `PLANS.md`.

Não houve alteração de runtime, schema, estado do aluno, publicação, push ou deploy. Validação da Library não fecha o gate de aplicação/E2E já pendente. NEXT ACTION: selecionar uma aula piloto ou uma pesquisa focal com os limites acima; manter fontes com erros e direitos pendentes visíveis até revisão humana.
