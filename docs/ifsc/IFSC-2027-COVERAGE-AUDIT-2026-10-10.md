# Conferência do edital IFSC 2027 com o Estudisc

Atualização posterior à conferência, 10/10/2026: MAT-16 v4 e MAT-17 v4 já estão publicadas com o complemento de ensino abaixo: comprimento da circunferência, área circular, exemplos resolvidos, exploração do contorno e aplicação explícita do paralelepípedo. [Publicação e validação reais](../estudisc/GEOMETRY-COMPLEMENT-RELEASE.md). Os achados descritos a seguir registram a situação anterior à publicação. A etapa acrescentou exemplos/exploração, sem novas questões avaliadas ou certificação formal de todo subtópico.

Conferência em 10/10/2026: os **24 grupos programáticos têm aulas correspondentes publicadas**. Não encontrei uma disciplina ou grupo inteiro ausente. Isso confirma uma base ampla para estudar agora; a análise também encontrou complementos que devem ser feitos antes de afirmar que nenhum subtópico falta.

A referência atual foi obtida diretamente do [portal oficial de editais abertos](https://www.ifsc.edu.br/editais-com-inscricoes-abertas): [Edital 05/DEING/2027/1, técnicos integrados](https://www.ifsc.edu.br/documents/d/ingresso/edital-05_2027_1_tecnico_integrado_prova-ok-1-), publicado em 25/09/2026. O Anexo V está nas páginas físicas 41–43 do PDF de 44 páginas; o índice interno tem paginação desatualizada. Prova em 29/11/2026, às 14h, quatro horas, 28 questões, sete por área. A seleção dos subsequentes é outro edital e não foi usada nesta comparação.

PDF baixado: SHA-256 `94d9120cf7d1de2f5b5edd56def3c91c0ca36b6510b15a87a48660b11bfdfce3`. Arquivo e extração ficam em `.local/ifsc-edital-audit/`.

## Disponibilidade real

Leitura SQL somente de consulta, em 10/10/2026 às 20:46:55 UTC: **132 identidades, todas com versão mais recente publicada e release publicado**. Matemática 19; Ciências 40; Geografia/História 49; Português 24. Foram examinados os blocos das versões atuais, incluindo melhorias já ativadas, e os quatro packs locais auditados. Não foi usado um seed curricular antigo como prova de cobertura atual.

## Matriz por item do Anexo V

“Presente” significa correspondência com conteúdo publicado, não registro independente de QA, grau de aprofundamento uniforme ou estado formal `VALIDATED` no motor curricular.

| Item | Síntese | Aulas correspondentes | Resultado |
| --- | --- | --- | --- |
| POR 1 | Leitura | POR-01–04 | Presente |
| POR 2 | Língua no texto | POR-05–16 | Presente |
| POR 3 | Organização textual | POR-17–22 | Presente |
| POR 4 | Variação linguística | POR-23–24 | Presente |
| MAT 1 | Aritmética | MAT-01–10 | Presente |
| MAT 2 | Álgebra | MAT-11–15 | Presente |
| MAT 3 | Geometria e medidas | MAT-16–17 | Presente; complementar abaixo |
| MAT 4 | Dados e contagem | MAT-18 | Presente |
| GH 1 | Fundamentos | GH-01–04 | Presente |
| GH 2 | Santa Catarina | GH-05–11 | Presente |
| GH 3 | Brasil | GH-12–28 | Presente |
| GH 4 | Mundo contemporâneo | GH-29–31 | Presente |
| GH 5 | História geral | GH-32–49 | Presente |
| CIE 1.1 | Mecânica | CIE-01–02 | Presente |
| CIE 1.2 | Energia térmica | CIE-03–05 | Presente |
| CIE 1.3 | Eletricidade | CIE-06–07 | Presente |
| CIE 1.4 | Matéria e química | CIE-08–14 | Presente |
| CIE 2.1 | Células | CIE-15–18 | Presente |
| CIE 2.2 | Ambiente | CIE-19–24 | Presente |
| CIE 2.3 | Genética aplicada | CIE-25–26 | Presente |
| CIE 2.4 | Diversidade dos seres vivos | CIE-27–28 | Presente |
| CIE 2.5 | Corpo e saúde | CIE-29–33 | Presente |
| CIE 2.6 | Evolução | CIE-34–36 | Presente |
| CIE 3.1 | Astronomia | CIE-37–40 | Presente |

MAT-PREREQ é preparação adicional; não foi usado para esconder a ausência de uma aula oficial correspondente.

## Complementos concretos e limites

1. **Prioridade: círculo e circunferência.** MAT-17 v3, `BLK-MAT-17-C03`, explica área da base circular, raio/diâmetro e volume do cilindro; cita o comprimento da circunferência apenas para evitar confundi-lo com a área. Não foi encontrada explicação da relação `C = 2πr`, exemplo resolvido próprio ou questão específica nos Questions do pack de Matemática. Acrescentar perímetro circular e aplicação separada de área circular é um complemento útil da geometria plana. O edital descreve esse escopo de forma ampla; não nomeia círculo como item autônomo. Portanto, não alegamos uma nova exigência literal nem que toda geometria esteja ausente.
2. **Explicitar o paralelepípedo.** `BLK-MAT-17-C02` já ensina volume do prisma, base retangular e altura perpendicular, e `BLK-MAT-17-E02` aplica área da base vezes altura. A operação necessária está coberta, mas um exemplo com comprimento, largura e altura e o nome específico tornaria a correspondência mais clara.
3. **Melhorias didáticas continuam necessárias.** Há explicações publicadas nas outras áreas, mas exemplos de GH, como `GH-03-B09`, ainda usam enunciados genéricos de interpretação. Substituir/acompanhar isso com fontes concretas, mapas e exercícios contextualizados melhora a preparação. Esta conferência não valida individualmente todos os distratores/respostas nem certifica direitos das fontes ou profundidade de cada aula.

Os seis alertas da busca lexical foram inspecionados: operações de frações estão efetivamente em MAT-03, mesmo sem a palavra “racionais”; o prisma retangular aparece em MAT-17; GH-44 usa “entre-guerras”; CIE-25 usa “1ª Lei”; CIE-28 usa “animais”; CIE-33 usa “ISTs”. Nenhum desses alertas de grafia foi tratado automaticamente como conteúdo ausente. A triagem usou 244 termos de busca para localizar evidências; esse número não é uma contagem oficial de tópicos nem percentual de qualidade.

Seu irmão tem conteúdo publicado para todos os grandes grupos da prova. O restante é majoritariamente evolução e aprofundamento das aulas, **com alguns complementos de conteúdo**, especialmente o ponto geométrico acima. Não seria correto prometer cobertura integral de todo subtópico apenas pelo número de aulas.

## Verificação e próximos passos

```text
node .local/database-migration/private/coverage-read.mjs
node .local/source-goal-enrichment/coverage-screen.mjs
pnpm exec tsx .local/source-goal-enrichment/coverage-inspect.ts MAT-17 CIE-26 CIE-24 POR-23 GH-03
Get-FileHash -Algorithm SHA256 -LiteralPath .local/ifsc-edital-audit/edital-05-2027-1.pdf
git diff --check
```

Leitura do PDF, inspeção dirigida dos blocos e conferências complementares locais ocorreram sem importar, publicar, alterar mapeamentos ou registrar respostas/evidências de aluno. Nenhum teste de runtime é necessário para este relatório de consulta; os dados de produção ficaram intactos. Próxima prioridade registrada: complementar a geometria através da versão aditiva existente, antes de novas melhorias apenas visuais/interativas, e manter o restante do enriquecimento em lotes limitados.
