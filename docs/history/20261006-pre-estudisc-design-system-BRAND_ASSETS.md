# Estudisc — Marca e assets oficiais

Versão atual: consulte design-system/VERSION (fonte única).

Este documento define o símbolo, o wordmark, o lockup e os arquivos oficiais da marca Estudisc.
Ele não define os ícones usados na interface; para isso, consulte `ICONOGRAPHY.md`.

---


## 0. Estudisc (2026-10-01) — marca atual do app

Por decisão do proprietário, o app passou a se chamar **Estudisc**. Símbolo: um “V” cujo braço direito termina em ponta de seta — letra e vetor ao mesmo tempo, apontando para cima (progresso). Quadrado `signal` (#FFD43B) com contorno `ink` (#17141F) de 4 px na grade de 64 px; glifo com traço de 7 px e junção em ângulo.

| Arquivo | Uso |
|---|---|
| `assets/vecta-mark.svg` | símbolo canônico, também usado como `src/app/icon.svg` |
| `assets/vecta-mark-mono.svg` | versão de uma cor |
| `src/app/apple-icon.png` | Apple touch icon 180 px, sangrado sem contorno |

O wordmark “vecta” é texto vivo em Archivo 900, largura 125%, minúsculas, renderizado pelo componente `BrandLockup`; não há lockup em SVG porque SVG em `<img>` não carrega a fonte do produto. Os tokens e a direção neo-brutalista não mudam. Os assets Estudisc abaixo ficam como histórico.

## 1. Conceito do símbolo

O símbolo representa um **caderno aberto** como estrutura de conhecimento:

- cortes laterais indicam o volume das páginas;
- a página esquerda contém três linhas de texto;
- a lombada central é sólida e estrutural;
- a página direita usa a cor `signal`;
- a geometria é reta, modular e compatível com o Brutalismo Técnico.

A marca conecta a origem do produto — registrar e construir conhecimento — à ideia de um sistema operacional pessoal de aprendizagem.

---

## 2. Wordmark

Forma oficial:

`Estudisc`

Regras:

- família: JetBrains Mono;
- peso: 700;
- caixa: uppercase;
- tracking de referência: `0.22em`;
- cor padrão: `color.ink`;
- não substituir `/` por outro separador;
- não alterar a ordem, condensar letras ou criar versões empilhadas sem nova aprovação.

O lockup horizontal combina o símbolo à esquerda e o wordmark à direita.

---

## 3. Assets oficiais

| Arquivo | Uso |
|---|---|
| `assets/know-os-icon.svg` | símbolo canônico vetorial, grade de 64 px, com linhas internas |
| `assets/know-os-icon-mono.svg` | versão monocromática para contextos de uma cor ou fundo controlado |
| `assets/know-os-icon-26.svg` | silhueta simplificada para tamanhos de até 32 px |
| `assets/know-os-lockup.svg` | lockup horizontal: símbolo + wordmark |
| `assets/know-os-icon-512.png` | app icon e metadados de alta resolução |
| `assets/know-os-icon-180.png` | Apple touch icon |
| `assets/know-os-icon-32.png` | favicon raster de compatibilidade |
| `KNOW-OS Icone.dc.html` | referência visual e exploração; não é código de produção |

O SVG é sempre a fonte preferencial. PNGs são derivados para plataformas que os exigem.

---

## 4. Uso correto

- preservar proporção e viewBox dos SVGs;
- manter área de respiro mínima equivalente a 25% da largura do símbolo;
- usar a versão simplificada abaixo de 32 px;
- usar a versão monocromática quando a cor `signal` não puder ser reproduzida adequadamente;
- manter contraste conforme `ACCESSIBILITY.md` e `COLOR_SYSTEM.md`;
- em fundos não controlados, aplicar uma superfície de marca antes de aplicar o símbolo;
- fornecer nome acessível `Estudisc` quando a marca funcionar como link ou controle.

---

## 5. Usos proibidos

- mudar as cores internas arbitrariamente;
- aplicar gradiente, brilho, blur ou sombra difusa;
- arredondar cantos do símbolo;
- distorcer, inclinar ou alterar proporções;
- substituir o wordmark por uma fonte sans;
- usar o símbolo como ícone genérico de navegação ou de ação;
- misturar o símbolo com ícones Lucide dentro da mesma função de interface;
- usar animação contínua dentro do produto.

---

## 6. Motion de marca

O produto utiliza os assets oficiais de forma estática por padrão.

Uma animação de páginas pode existir somente em material promocional ou em uma abertura pontual, com estas condições:

- reprodução única, nunca em loop contínuo;
- não bloquear interação nem carregamento;
- versão estática imediata com `prefers-reduced-motion: reduce`;
- não aparecer em sidebar, topbar, botões, loading ou navegação recorrente;
- não alterar o significado da página direita em `signal`.

As durações de interface de `MOTION.md` não devem ser reinterpretadas para criar animações decorativas dentro do aplicativo.

---

## 7. Separação entre marca e iconografia

A marca é um identificador do produto. A iconografia de interface comunica ações e estados.

- Marca: assets descritos neste documento.
- Interface: Lucide em geometria original, conforme `ICONOGRAPHY.md`.
- Símbolos de domínio: glifos tipográficos de Mastery, diff e terminal.

Essas três camadas não devem ser misturadas silenciosamente.
