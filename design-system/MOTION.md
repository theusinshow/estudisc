# Estudisc — Motion

## Princípio

Movimento comunica resposta do sistema. Não existe animação decorativa contínua.
Durações e deslocamentos vêm de `design-tokens.json`.

## Aplicações

- botão: redução de sombra + deslocamento mecânico no active;
- navegação/tabs: mudança curta de régua/posição;
- drawer/modal/palette: opacity + translate curto;
- lesson step: reveal discreto, sem slide longo;
- resposta correta/incorreta: atualização de borda, ícone e texto; sem shake;
- dica: expansão curta com preservação do foco;
- execução: status textual e indicador de processo; sem spinner infinito quando houver progresso determinável;
- terminal: novas linhas surgem sem animação que atrapalhe leitura;
- mastery/XP: atualização discreta em módulos separados;
- badge unlock: uma única revelação curta, sem partículas;
- import: transição de estados textual e progressiva;
- toast: entrada/saída curta, sem ser única fonte de feedback.

## Caderno de prova (ADR 0067)

Tokens `motion.press`, `motion.ui*`, `motion.stamp*`, `motion.questionTravel` e `motion.easeOut`:

- pressão: a ação desce `elevation.action.pressTravel` e a sombra zera em `motion.press`;
- resposta: a bolha da alternativa preenche (scale 0→1) e o carimbo "Certo"/"Revise" entra com `motion.stampRotation` em `motion.stamp`;
- transição entre questões: slide horizontal de `motion.questionTravel`;
- progresso: a régua cresce até o valor real; contagem numérica só no fim da sessão;
- ClickSpark fica fora do fluxo de estudo (permitido apenas em conquista).

Só `transform` e `opacity` animam; easing sem overshoot.

## Reduced motion

Desabilitar translate e revelar imediatamente o estado final. Foco, texto e
semântica permanecem intactos.
