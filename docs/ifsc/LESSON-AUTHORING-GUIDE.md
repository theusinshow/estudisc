# Guia de autoria de aulas — Vecta / IFSC

Este guia descreve como montar uma aula boa no Vecta, do rascunho até a revisão. A aula-modelo é a **CIE-01 (Movimento e máquinas simples)**, em `packs/seeds/ifsc-2027.lesson-drafts/CIE-A.json`, com figuras em `figures/CIE-01/`. Use-a como referência concreta para tudo o que está abaixo.

Regras que não mudam (de `AGENTS.md` e `04-PEDAGOGY.md`):

- O conceito é a unidade de domínio. Concluir uma aula nunca marca domínio; só respostas independentes contam.
- Todo conteúdo novo nasce como **rascunho**. Quem escreve não aprova; a publicação passa pelas quatro camadas de QA no `/admin` (`12-CONTENT-QA.md`).
- Nenhuma questão oficial reservada nem imagem de prova protegida entra em aula ou figura.

## 1. Anatomia de uma aula

O aluno estuda no celular, uma ideia por tela. O modo "um passo por vez" transforma cada bloco num passo. A sequência que funciona:

| Ordem | Bloco | Passo que o aluno vê | Para quê |
|---|---|---|---|
| 1 | `hook` (texto) | Para começar | Uma situação concreta que só se resolve com a aula |
| 2 | `opening` (predição) | Antes de começar | O aluno se compromete com um palpite; a aula depois confirma ou corrige |
| 3 | Para cada conceito: intuição → regra | Conceito | Primeiro o sentido, depois a definição precisa |
| 4 | Figura do conceito | Observe | Mostrar o que o texto descreve: forças, mapas, gráficos, processos |
| 5 | 1–2 exemplos resolvidos | Exemplo resolvido | Passos numerados, com conferência no fim |
| 6 | Atividade de autochecagem | Atividade | Classificar, ordenar, ligar, marcar trecho ou passos guiados; não grava tentativa |
| 7 | Armadilha (`pitfall`) | Cuidado | O erro mais comum, dito com todas as letras |
| 8 | Checagem rápida | Checagem rápida | A 1ª questão de cada conceito aparece logo depois dele, automaticamente |
| 9 | `integration` | Atividade / Antes de começar | Atividades que juntam conceitos; retomar a predição de abertura |
| 10 | Resumo | Resumo | Uma ideia por linha, para revisar depois |
| 11 | Prática e desafio final | Prática / Desafio final | Questões independentes e as 3 do exit ticket |

Tamanho de referência: 4 a 6 conceitos, cerca de 40 minutos, 10 a 17 questões. Acima de 6 conceitos, considere dividir a aula na próxima revisão do currículo.

## 2. Catálogo de formatos

Todos já são renderizados pelo app e validados na importação. No rascunho, entram em `concepts[].extras`, em `opening` ou em `integration`.

| Formato | Use quando | Evite quando | Campos principais |
|---|---|---|---|
| **Figura** (`figure`) | A ideia é espacial ou visual: alavanca, mapa, gráfico, linha do tempo desenhada, ciclo | A imagem só enfeita | `file`, `alt`, `caption`, `longDescription`, `credit` |
| **Predição** (`prediction`) | Há uma ideia intuitiva errada para confrontar ("a rampa dá energia?") | A resposta é óbvia | `title`, `content` |
| **Classificar** (`classification`) | Separar exemplos em categorias (tipos de alavanca, fontes renováveis × não renováveis, gêneros) | Há só duas categorias e três itens; use múltipla escolha | `items`, `destinations`, `expected` |
| **Ordenar** (`ordering`) | Sequência importa: cronologia, etapas de processo, roteiro de resolução | A ordem é arbitrária | `items`, `expectedOrder` |
| **Ligar** (`matching`) | Pares um-para-um: conceito ↔ exemplo, causa ↔ efeito, termo ↔ definição | Um item tem duas respostas | `items`, `destinations`, `expected` |
| **Marcar trecho** (`text-highlight`) | Achar a evidência num texto (Português, fontes de História) | O trecho certo é ambíguo | `items` (trechos), `expectedIds` |
| **Passos guiados** (`guided-steps`) | Um cálculo em etapas; cada etapa com resposta exata | Respostas decimais: o aluno pode escrever 0,25 ou 0.25; prefira etapas com inteiros | `steps[]` (`prompt`, `expected`) |
| **Exemplo resolvido** (`examples`) | Sempre, 1 a 2 por conceito | — | `title`, `content` (passos numerados) |

Campos comuns às atividades: `title` (o enunciado que aparece), `instructions`, `hints` (até 3), `explanation`. Posição: figuras entram logo depois da regra; atividades, depois dos exemplos. Para encaixar um extra depois de um exemplo específico, use `afterExample: 1` (ou 2).

## 3. Modelos por área

| Área | Espinha da aula | Formatos que mais rendem |
|---|---|---|
| **Matemática** | Situação → regra → 2 exemplos com conferência → passos guiados | Passos guiados, figura (reta numérica, gráfico, figura geométrica), ordenar etapas |
| **Português** | Texto curto original → conceito → leitura guiada → evidência | Marcar trecho, classificar (gênero, finalidade, voz), texto-base no `stimulus` das questões |
| **Ciências** | Fenômeno do dia a dia → modelo → figura do processo → cálculo ou classificação | Figura de forças e fluxos de energia, classificar, passos guiados para contas |
| **Geografia e História** | Fonte ou mapa → conceito → interrogar a fonte (quem, quando, para quê) | Figura (mapa com escala e legenda, gráfico, linha do tempo), ordenar cronologia, ligar causa ↔ consequência, marcar trecho em fonte |

## 4. Imagens (ADR 0032)

- **Formato:** SVG feito para a aula, em `figures/<AULA>/<nome>.svg`. O expansor embute o arquivo na versão da aula, e a figura muda junto com a aula. PNG, WebP e JPEG também são aceitos até 200 kB.
- **Desenho:** fundo `#FFFCF5`, traço `#17141F`, destaques nas cores do sistema (`#FFD43B` amarelo, `#14804A` verde, `#C8321F` vermelho, `#8FDCFF` azul). Num `viewBox` de 640 px de largura, nenhum texto menor que 17 px, porque no celular a imagem fica com cerca de 340 px. Setas com marcador apontando no sentido da força.
- **Nada essencial só na imagem.** `alt` diz o que a imagem é (mínimo de 12 caracteres). `longDescription` descreve tudo o que ela ensina, em texto, para leitores de tela e para quem não enxerga bem. `caption` diz a ideia principal.
- **Crédito:** "Ilustração própria (rascunho)" é o padrão. Material de domínio público só com autor, licença e fonte no `credit`.
- **Proibido:** scripts, links externos, `foreignObject` (a importação recusa), imagens de provas oficiais e cópias de livros didáticos.
- **Revisão visual:** antes de entregar, renderize as figuras a 343 px de largura e confira se o texto cabe e as setas apontam certo.

## 5. Texto

- Português do Brasil para o 9º ano; parágrafos curtos, de até cerca de 90 palavras por bloco.
- Separe parágrafos com linha em branco. Passos numerados, um por linha.
- Números com vírgula decimal (12,5) e unidades sempre explícitas.
- Contextos concretos, de preferência catarinenses ou brasileiros, sem estereótipos.
- Fatos só os bem estabelecidos. Na dúvida, diga de forma qualitativa e registre o ponto para o revisor.

## 6. Questões

- Pelo menos 2 por conceito; exatamente 3 com `"exit": true`, no fim, misturando conceitos.
- Múltipla escolha com 5 alternativas distintas e uma única defensável. Os distratores vêm de erros reais.
- **Sem pista de tamanho:** a correta não pode ser a mais longa ou a mais detalhada. Dê aos distratores a mesma estrutura.
- Gabarito distribuído entre A e E; alternativas numéricas em ordem crescente.
- 1 a 3 dicas progressivas, e a primeira nunca entrega a resposta.
- A explicação diz por que a certa está certa **e** por que o distrator principal está errado.
- Exit tickets e prática nunca repetem os números de um exemplo resolvido.
- Textos e situações originais; nunca copiar questão oficial.

## 7. Checklist e comandos

1. `IFSC_DRAFT_FILE=<arquivo>.json node scripts/expand-ifsc-lesson-drafts.mjs > /dev/null`: estrutura, conceitos e figuras.
2. `node scripts/audit-lesson-drafts.mjs`: posição do gabarito, pista de tamanho, ordem numérica, dicas.
3. `pnpm vitest run tests/unit/ifsc-lesson-drafts.test.ts`: o Pack completo valida.
4. Revisão humana nas quatro camadas: estrutura, fatos (refazer cada conta), pedagogia e alinhamento ao IFSC. Registre achados como em `WEEK-01-REVIEW.md`.
5. Abra a aula no servidor de demonstração (`node scripts/demo-local.mjs`) no celular e passe por todos os passos.

## 8. Exemplo de conceito completo (rascunho)

```json
{
  "conceptId": "CIE.MECH.SIMPLE_MACHINES",
  "title": "Máquinas simples trocam força por distância",
  "intuition": "Tente levantar uma pedra pesada com as mãos…",
  "content": "Máquina simples é um dispositivo que muda a intensidade ou a direção de uma força…",
  "examples": [
    { "title": "Levantando uma pedra com uma barra", "content": "1. Equilíbrio: F × 120 = 600 × 20.\n2. …" },
    { "title": "Roldana móvel e o preço da corda", "content": "1. A força cai pela metade…" }
  ],
  "extras": [
    { "type": "figure", "file": "CIE-01/alavancas.svg", "alt": "Os três tipos de alavanca…", "caption": "O que muda é o elemento que fica no meio.", "longDescription": "Interfixa: o apoio fica no meio…" },
    { "type": "classification", "afterExample": 1, "title": "Classifique cada alavanca", "items": [ { "id": "gangorra", "label": "Gangorra" } ], "destinations": [ { "id": "interfixa", "label": "Interfixa" } ], "expected": { "gangorra": "interfixa" } },
    { "type": "figure", "afterExample": 1, "file": "CIE-01/roldanas.svg", "alt": "…", "caption": "…" }
  ],
  "pitfall": { "title": "Máquina não cria energia", "content": "…" }
}
```

## Pendências conhecidas

`node scripts/audit-lesson-drafts.mjs` aponta as aulas antigas MAT-03 a MAT-10 (fora da semana 1): sem dicas, alternativas numéricas fora de ordem e, na MAT-10, gabarito que nunca é E. Elas também não têm exemplos resolvidos nem armadilhas. Leve-as a este padrão antes de publicar.
