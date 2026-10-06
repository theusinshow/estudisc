# Estudisc — Acessibilidade

Este documento tem precedência máxima.

## Teclado

- toda ação operável por teclado;
- ordem de foco acompanha a ordem visual e semântica;
- skip links para navegação e conteúdo principal;
- `Ctrl+K` abre a Command Palette;
- Escape fecha overlay quando seguro;
- atalhos de atividade são documentados e configuráveis.

## Foco

`outline: none` sem substituto é proibido. Usar tokens `focus.*` com anel e
offset canônicos. O foco precisa ser visível em paper, panel, signal e machine.

## Semântica

- landmarks: header, nav, main, aside e footer quando aplicáveis;
- heading hierarchy sem saltos arbitrários;
- botões para ações, links para navegação;
- tabelas somente para dados realmente tabulares;
- status assíncronos em regiões `status` ou `log` adequadas;
- modal com título, descrição e foco preso.

## Estados

Nenhum estado depende só de cor. Estado comum exige um indicador não cromático.
Erro, sucesso, conflito e bloqueio usam pelo menos dois canais não cromáticos.

## Contraste

Todos os pares de cores precisam atender WCAG AA no uso pretendido. Texto pequeno,
metadado e placeholder devem ser testados; `dim` não pode ser usado quando falhar.

## Toque e ponteiro

Abaixo de 1200px, alvo mínimo de 44×44. Elementos visuais menores podem ter hit
area ampliada. Não depender de hover para revelar ação essencial.

## Reduced motion

Com `prefers-reduced-motion: reduce`, eliminar deslocamento e transições não
essenciais; manter mudança instantânea de estado. Nenhuma animação contínua existe.

## Escala de texto

A interface suporta zoom do navegador e aumento de fonte sem perda funcional.
Não fixar alturas que cortem conteúdo textual.

## Programming Lab

- editor precisa de modo acessível e atalhos não conflitantes;
- terminal usa região de log com controle de anúncios;
- erros aparecem em texto completo fora da coloração sintática;
- testes têm nome, estado e explicação textual;
- tabs preservam foco e relacionamento semântico.

## Conteúdo técnico

Código pode rolar horizontalmente. Não reduzir fonte abaixo do limite legível para
“caber”. Fornecer cópia e visualização ampliada quando necessário.
